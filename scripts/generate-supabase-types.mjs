#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      types {
        kind
        name
        fields {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        inputFields {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        enumValues { name }
      }
    }
  }
`;

async function fetchIntrospection() {
  const response = await fetch(`${SUPABASE_URL}/graphql/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: introspectionQuery }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GraphQL introspection failed: ${response.status} ${response.statusText}\n${text}`);
  }

  const data = await response.json();
  return data.data.__schema.types;
}

function parseSqlColumnMeta(sql) {
  const tableMeta = new Map();
  const createTableRegex = /CREATE TABLE IF NOT EXISTS "public"\."([^"]+)" \(([^;]+?)\);/gs;

  const splitDefinitions = (block) => {
    const parts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < block.length; i++) {
      const ch = block[i];
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  };

  let match;
  while ((match = createTableRegex.exec(sql))) {
    const [, tableName, block] = match;
    const definitions = splitDefinitions(block);
    const columns = new Map();

    for (const def of definitions) {
      if (!def.startsWith('"')) continue;
      const nameMatch = def.match(/^"([^"]+)"/);
      if (!nameMatch) continue;
      const columnName = nameMatch[1];
      const remainder = def.slice(nameMatch[0].length).trim();

      const hasDefault = /DEFAULT\b/i.test(remainder) || /nextval\(/i.test(remainder) || /GENERATED\s+(ALWAYS|BY DEFAULT)\s+AS\s+IDENTITY/i.test(remainder);
      const isIdentity = /GENERATED\s+(ALWAYS|BY DEFAULT)\s+AS\s+IDENTITY/i.test(remainder);

      columns.set(columnName, {
        hasDefault,
        isIdentity,
      });
    }

    tableMeta.set(tableName, { columns });
  }

  return tableMeta;
}

function parseRelationships(sql) {
  const relationshipsByTable = new Map();
  const fkRegex = /ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT "([^"]+)" FOREIGN KEY \(([^)]+)\) REFERENCES "([^"]+)"\."([^"]+)"\s*\(([^)]+)\)/g;
  let match;
  while ((match = fkRegex.exec(sql))) {
    const [, table, constraint, columnList, refSchema, refTable, refColumnList] = match;
    const columns = columnList.split(',').map((c) => c.replace(/"/g, '').trim());
    const referencedColumns = refColumnList.split(',').map((c) => c.replace(/"/g, '').trim());
    const relation = {
      foreignKeyName: constraint,
      columns,
      isOneToOne: false,
      referencedRelation: refTable,
      referencedColumns,
      referencedSchema: refSchema,
    };
    if (!relationshipsByTable.has(table)) {
      relationshipsByTable.set(table, []);
    }
    relationshipsByTable.get(table).push(relation);
  }
  return relationshipsByTable;
}

function unwrapGraphqlType(type) {
  let nullable = true;
  let isArray = false;
  let base = null;
  let current = type;

  while (current) {
    if (current.kind === 'NON_NULL') {
      nullable = false;
      current = current.ofType;
      continue;
    }
    if (current.kind === 'LIST') {
      isArray = true;
      current = current.ofType;
      continue;
    }
    base = current.name;
    break;
  }

  return { base, nullable, isArray };
}

function mapGraphqlScalarToTs(base) {
  switch (base) {
    case 'Int':
    case 'Float':
    case 'BigFloat':
      return 'number';
    case 'BigInt':
    case 'UUID':
    case 'ID':
    case 'String':
    case 'Date':
    case 'Datetime':
    case 'Time':
    case 'Cursor':
      return 'string';
    case 'Boolean':
      return 'boolean';
    case 'JSON':
      return 'Json';
    case 'Opaque':
      return 'unknown';
    default:
      throw new Error(`Unsupported GraphQL scalar: ${base}`);
  }
}

function formatTsType(base, { nullable, isArray }) {
  let ts = base;
  if (isArray) {
    ts = `${ts}[]`;
  }
  if (nullable) {
    ts = `${ts} | null`;
  }
  return ts;
}

function buildTables(types, sqlMeta, relationships) {
  const tables = new Map();

  for (const type of types) {
    if (type.kind !== 'OBJECT') continue;
    if (!sqlMeta.has(type.name)) continue;

    const tableName = type.name;
    const columnMeta = sqlMeta.get(tableName).columns;
    const rows = [];

    for (const field of type.fields ?? []) {
      if (!columnMeta.has(field.name)) continue;
      const { base, nullable, isArray } = unwrapGraphqlType(field.type);
      const tsBase = mapGraphqlScalarToTs(base);
      const tsType = formatTsType(tsBase, { nullable, isArray });
      rows.push({ column: field.name, tsType, nullable });
    }

    rows.sort((a, b) => a.column.localeCompare(b.column));

    tables.set(tableName, {
      columns: rows,
      meta: columnMeta,
      relationships: relationships.get(tableName) ?? [],
    });
  }

  return tables;
}

function parseFunctions(sql) {
  const functions = new Map();
  const fnRegex = /CREATE OR REPLACE FUNCTION "public"\."([^"]+)"\(([^)]*)\)\s+RETURNS\s+([\s\S]+?)\s+LANGUAGE/gi;

  const splitArgs = (args) => {
    const parts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < args.length; i++) {
      const ch = args[i];
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts.filter(Boolean);
  };

  const cleanType = (raw) => raw.replace(/"/g, '').trim();

  let match;
  while ((match = fnRegex.exec(sql))) {
    const [, name, rawArgs, rawReturn] = match;
    const argList = rawArgs.trim() ? splitArgs(rawArgs.trim()) : [];
    const args = argList.map((arg) => {
      const nameMatch = arg.match(/^"([^"]+)"/);
      const argName = nameMatch ? nameMatch[1] : null;
      const remainder = nameMatch ? arg.slice(nameMatch[0].length).trim() : arg.trim();
      const typeMatch = remainder.match(/^([A-Za-z0-9_"\s\.]+?)(?:\s+DEFAULT|\s*$)/i);
      if (!argName || !typeMatch) {
        return null;
      }
      const pgType = cleanType(typeMatch[1]);
      const hasDefault = /DEFAULT/i.test(remainder);
      return { name: argName, pgType, hasDefault };
    }).filter(Boolean);

    const returnInfo = parseFunctionReturn(cleanType(rawReturn.trim()));

    if (!functions.has(name)) {
      functions.set(name, []);
    }
    functions.get(name).push({ args, returns: returnInfo });
  }

  return combineFunctionOverloads(functions);
}

function parseFunctionReturn(rawReturn) {
  if (rawReturn.startsWith('TABLE(')) {
    const inner = rawReturn.slice('TABLE('.length, rawReturn.lastIndexOf(')'));
    const columns = inner
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const match = segment.match(/^(?:"([^"]+)"|([A-Za-z0-9_]+))\s+(.+)$/);
        if (!match) {
          throw new Error(`Unable to parse function TABLE return column: ${segment}`);
        }
        const [, quotedName, plainName, type] = match;
        const name = (quotedName ?? plainName).trim();
        return { name, type: type.replace(/"/g, '') };
      });
    return { kind: 'table', columns };
  }

  const simpleType = rawReturn.replace(/"/g, '').trim();
  return { kind: 'scalar', type: simpleType };
}

function combineFunctionOverloads(map) {
  const result = new Map();
  for (const [name, overloads] of map.entries()) {
    const combined = overloads.map(({ args, returns }) => ({
      args: args.map(({ name: argName, pgType, hasDefault }) => ({
        name: argName,
        tsType: mapPgTypeToTs(pgType, false),
        optional: hasDefault,
      })),
      returns,
    }));
    result.set(name, combined);
  }
  return result;
}

function mapPgTypeToTs(pgType, nullable) {
  const lower = pgType.toLowerCase();
  let base;
  if (lower.endsWith('[]')) {
    const element = mapPgTypeToTs(pgType.slice(0, -2), false).replace(/ \| null$/, '');
    base = `${element}[]`;
  } else if (lower === 'text' || lower === 'character varying' || lower === 'varchar' || lower === 'citext' || lower === 'uuid' || lower === 'name') {
    base = 'string';
  } else if (lower === 'json' || lower === 'jsonb') {
    base = 'Json';
  } else if (lower === 'date' || lower.startsWith('timestamp') || lower.startsWith('time')) {
    base = 'string';
  } else if (lower === 'boolean') {
    base = 'boolean';
  } else if (lower === 'numeric' || lower === 'real' || lower === 'double precision' || lower === 'integer' || lower === 'smallint') {
    base = 'number';
  } else if (lower === 'bigint') {
    base = 'string';
  } else if (lower === 'void') {
    base = 'void';
  } else if (lower === 'trigger') {
    base = 'unknown';
  } else {
    throw new Error(`Unsupported PostgreSQL type: ${pgType}`);
  }

  if (nullable && !base.endsWith(' | null') && base !== 'void' && base !== 'unknown') {
    return `${base} | null`;
  }
  return base;
}

function formatFunctionReturns(returnInfo) {
  if (returnInfo.kind === 'table') {
    const rows = returnInfo.columns.map(({ name, type }) => {
      const tsType = mapPgTypeToTs(type, true);
      return `          ${name}: ${tsType}`;
    });
    return `{
${rows.join('\n')}
        }[]`;
  }
  return mapPgTypeToTs(returnInfo.type, false);
}

function renderDatabaseType(tables, functions) {
  const lines = [];
  lines.push('export type Json =');
  lines.push('  | string');
  lines.push('  | number');
  lines.push('  | boolean');
  lines.push('  | null');
  lines.push('  | { [key: string]: Json | undefined }');
  lines.push('  | Json[]');
  lines.push('');
  lines.push('export type Database = {');
  lines.push('  // Allows to automatically instanciate createClient with right options');
  lines.push("  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)");
  lines.push('  __InternalSupabase: {');
  lines.push('    PostgrestVersion: "normalized"');
  lines.push('  }');
  lines.push('');
  lines.push('  public: {');
  lines.push('    Tables: {');

  const tableEntries = [...tables.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [tableName, table] of tableEntries) {
    lines.push(`      ${tableName}: {`);
    lines.push('        Row: {');
    for (const { column, tsType } of table.columns) {
      lines.push(`          ${column}: ${tsType}`);
    }
    lines.push('        }');
    lines.push('        Insert: {');
    for (const { column, tsType, nullable } of table.columns) {
      const meta = table.meta.get(column);
      const optional = nullable || meta.hasDefault || meta.isIdentity;
      const prop = optional ? `${column}?: ${tsType}` : `${column}: ${tsType}`;
      lines.push(`          ${prop}`);
    }
    lines.push('        }');
    lines.push('        Update: {');
    for (const { column, tsType } of table.columns) {
      lines.push(`          ${column}?: ${tsType}`);
    }
    lines.push('        }');
    const relationships = table.relationships;
    if (!relationships.length) {
      lines.push('        Relationships: []');
    } else {
      lines.push('        Relationships: [');
      for (const relation of relationships) {
        lines.push('          {');
        lines.push(`            foreignKeyName: "${relation.foreignKeyName}"`);
        lines.push(`            columns: [${relation.columns.map((c) => `"${c}"`).join(', ')}]`);
        lines.push(`            isOneToOne: ${relation.isOneToOne ? 'true' : 'false'}`);
        lines.push(`            referencedRelation: "${relation.referencedRelation}"`);
        lines.push(`            referencedColumns: [${relation.referencedColumns.map((c) => `"${c}"`).join(', ')}]`);
        lines.push('          },');
      }
      lines.push('        ]');
    }
    lines.push('      }');
  }

  lines.push('    }');
  lines.push('    Views: {');
  lines.push('      [_ in never]: never');
  lines.push('    }');
  lines.push('    Functions: {');

  const functionEntries = [...functions.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [name, overloads] of functionEntries) {
    lines.push(`      ${name}: {`);
    if (overloads.length === 1) {
      const overload = overloads[0];
      if (overload.args.length) {
        lines.push('        Args: {');
        lines.push(
          ...overload.args.map(({ name: argName, tsType, optional }) =>
            `          ${argName}${optional ? '?' : ''}: ${tsType}`
          )
        );
        lines.push('        }');
      } else {
        lines.push('        Args: Record<string, never>');
      }
      lines.push(`        Returns: ${formatFunctionReturns(overload.returns)}`);
    } else {
      lines.push('        Args:');
      const overloadLines = overloads.map((overload) => {
        if (!overload.args.length) {
          return '          | Record<string, never>';
        }
        const entries = overload.args
          .map(({ name: argName, tsType, optional }) => `${argName}${optional ? '?' : ''}: ${tsType}`)
          .join('; ');
        return `          | { ${entries} }`;
      });
      lines.push(...overloadLines);
      lines.push(`        Returns: ${formatFunctionReturns(overloads[0].returns)}`);
    }
    lines.push('      }');
  }

  lines.push('    }');
  lines.push('    Enums: {');
  lines.push('      [_ in never]: never');
  lines.push('    }');
  lines.push('    CompositeTypes: {');
  lines.push('      [_ in never]: never');
  lines.push('    }');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  lines.push('type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">');
  lines.push('');
  lines.push('type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]');
  lines.push('');
  lines.push('export type Tables<');
  lines.push('  DefaultSchemaTableNameOrOptions extends');
  lines.push('    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])');
  lines.push('    | { schema: keyof DatabaseWithoutInternals },');
  lines.push('  TableName extends DefaultSchemaTableNameOrOptions extends {');
  lines.push('    schema: keyof DatabaseWithoutInternals');
  lines.push('  }');
  lines.push('    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &');
  lines.push('        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])');
  lines.push('    : never = never,');
  lines.push('> = DefaultSchemaTableNameOrOptions extends {');
  lines.push('  schema: keyof DatabaseWithoutInternals');
  lines.push('}');
  lines.push('');
  lines.push('  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &');
  lines.push('      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {');
  lines.push('      Row: infer R');
  lines.push('    }');
  lines.push('    ? R');
  lines.push('    : never');
  lines.push('  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &');
  lines.push('        DefaultSchema["Views"])');
  lines.push('    ? (DefaultSchema["Tables"] &');
  lines.push('        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {');
  lines.push('        Row: infer R');
  lines.push('      }');
  lines.push('      ? R');
  lines.push('      : never');
  lines.push('    : never');
  lines.push('');
  lines.push('export type TablesInsert<');
  lines.push('  DefaultSchemaTableNameOrOptions extends');
  lines.push('    | keyof DefaultSchema["Tables"]');
  lines.push('    | { schema: keyof DatabaseWithoutInternals },');
  lines.push('  TableName extends DefaultSchemaTableNameOrOptions extends {');
  lines.push('    schema: keyof DatabaseWithoutInternals');
  lines.push('  }');
  lines.push('    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]');
  lines.push('    : never = never,');
  lines.push('> = DefaultSchemaTableNameOrOptions extends {');
  lines.push('  schema: keyof DatabaseWithoutInternals');
  lines.push('}');
  lines.push('');
  lines.push('  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {');
  lines.push('      Insert: infer I');
  lines.push('    }');
  lines.push('    ? I');
  lines.push('    : never');
  lines.push('  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]');
  lines.push('    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {');
  lines.push('        Insert: infer I');
  lines.push('      }');
  lines.push('      ? I');
  lines.push('      : never');
  lines.push('    : never');
  lines.push('');
  lines.push('export type TablesUpdate<');
  lines.push('  DefaultSchemaTableNameOrOptions extends');
  lines.push('    | keyof DefaultSchema["Tables"]');
  lines.push('    | { schema: keyof DatabaseWithoutInternals },');
  lines.push('  TableName extends DefaultSchemaTableNameOrOptions extends {');
  lines.push('    schema: keyof DatabaseWithoutInternals');
  lines.push('  }');
  lines.push('    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]');
  lines.push('    : never = never,');
  lines.push('> = DefaultSchemaTableNameOrOptions extends {');
  lines.push('  schema: keyof DatabaseWithoutInternals');
  lines.push('}');
  lines.push('');
  lines.push('  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {');
  lines.push('      Update: infer U');
  lines.push('    }');
  lines.push('    ? U');
  lines.push('    : never');
  lines.push('  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]');
  lines.push('    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {');
  lines.push('        Update: infer U');
  lines.push('      }');
  lines.push('      ? U');
  lines.push('      : never');
  lines.push('    : never');
  lines.push('');
  lines.push('export type Enums<');
  lines.push('  DefaultSchemaEnumNameOrOptions extends');
  lines.push('    | keyof DefaultSchema["Enums"]');
  lines.push('    | { schema: keyof DatabaseWithoutInternals },');
  lines.push('  EnumName extends DefaultSchemaEnumNameOrOptions extends {');
  lines.push('    schema: keyof DatabaseWithoutInternals');
  lines.push('  }');
  lines.push('    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]');
  lines.push('    : never = never,');
  lines.push('> = DefaultSchemaEnumNameOrOptions extends {');
  lines.push('  schema: keyof DatabaseWithoutInternals');
  lines.push('}');
  lines.push('');
  lines.push('  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]');
  lines.push('  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]');
  lines.push('    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]');
  lines.push('    : never');
  lines.push('');
  lines.push('export type CompositeTypes<');
  lines.push('  PublicCompositeTypeNameOrOptions extends');
  lines.push('    | keyof DefaultSchema["CompositeTypes"]');
  lines.push('    | { schema: keyof DatabaseWithoutInternals },');
  lines.push('  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {');
  lines.push('    schema: keyof DatabaseWithoutInternals');
  lines.push('  }');
  lines.push('    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]');
  lines.push('    : never = never,');
  lines.push('> = PublicCompositeTypeNameOrOptions extends {');
  lines.push('  schema: keyof DatabaseWithoutInternals');
  lines.push('}');
  lines.push('');
  lines.push('  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]');
  lines.push('  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]');
  lines.push('    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]');
  lines.push('    : never');
  lines.push('');
  lines.push('export const Constants = {');
  lines.push('  public: {');
  lines.push('    Enums: {},');
  lines.push('  },');
  lines.push('} as const');

  return lines.join('\n');
}

async function main() {
  const types = await fetchIntrospection();
  const sql = fs.readFileSync(path.join(projectRoot, 'cryptrac-schema.sql'), 'utf8');
  const sqlMeta = parseSqlColumnMeta(sql);
  const relationships = parseRelationships(sql);
  const tables = buildTables(types, sqlMeta, relationships);
  const functions = parseFunctions(sql);
  const output = renderDatabaseType(tables, functions);
  fs.writeFileSync(path.join(projectRoot, 'types', 'database.types.ts'), output + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
