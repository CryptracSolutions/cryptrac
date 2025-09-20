# Stripe-Parity UI Transformation - Phase Prompt
---

**PROJECT**: Cryptrac Stripe-Parity UI/UX Transformation - COMPLETE VISUAL PARITY
**CURRENT PHASE**: Phase 7 of 20 - Navigation System Perfection
**MASTER PLAN**: Located at `/docs/stripe-parity-20-phase-plan.md`
**GOAL**: Achieve 100% visual and experiential parity with Stripe's platform

## Context from Previous Phase
Phase 6 is now 100% complete with all appropriate pages updated to use our new data display
components

## Your Task
Execute Phase 7 as defined in the master plan document. Specifically:

1. **Read the master plan**: Start by reading `/docs/stripe-parity-20-phase-plan.md` and focus on Phase 7 section only
2. **Use these tools as specified**:
   - Figma Dev Mode MCP Server: Access UI toolkit at https://www.figma.com/design/uekT5Cdpnm6e8oO3m9bPvd/Stripe-Apps-UI-toolkit--Community-?node-id=17440-30033&m=dev
   - Use `mcp__figma-dev-mode-mcp-server__get_code` for component extraction
   - Use `mcp__figma-dev-mode-mcp-server__get_variable_defs` for design tokens
   - Use `mcp__figma-dev-mode-mcp-server__get_screenshot` to visualize components
   - WebFetch: For analyzing Stripe's live interfaces when needed
   - WebSearch: For Stripe design patterns and best practices

   **CRITICAL FIGMA EXTRACTION STRATEGY**:
   - Design tokens are embedded in components, not in separate token pages
   - Use component node IDs like 19744-39750 (Button), 18641-38696 (Form), 19057-60554 (Sign in) to extract tokens
   - If you get "Nothing is selected" error, use specific node IDs with the nodeId parameter or ask me to select it in my Figma desktop app

   **MAXIMUM EXTRACTION APPROACH**:
   For EVERY component you work with, ALWAYS:
   1. Call `get_code` with the node ID to get the full implementation
   2. Call `get_variable_defs` to extract all design tokens
   3. Call `get_screenshot` to visually verify the component
   4. Analyze the code for:
      - Exact spacing values (padding, margin, gap)
      - Precise border radius values
      - Complete shadow definitions
      - Animation/transition timings
      - Hover/focus/active states
      - Responsive breakpoints
      - Z-index layering
   5. Extract patterns like:
      - How components compose together
      - Consistent naming conventions
      - State management patterns
      - Accessibility attributes
   6. For complex components, use `get_metadata` first to understand structure, then extract child components
   7. Cross-reference multiple similar components to identify consistent patterns

   **COMPONENT DISCOVERY**:
   - Start with main patterns at node 17440-30033
   - Explore child nodes systematically
   - Common component IDs found:
     * Buttons: 19744-39750, 17340-35334
     * Forms: 18641-38696, 18641-38783
     * Lists: 18641-37833, 18641-38039
     * Auth: 19057-60554, 19057-60556
     * Modals/Drawers: 17340-35321
     * Cards: Various instance nodes

   **EXTRACTION COMPLETENESS**:
   - NEVER assume default values - extract everything explicitly
   - Capture ALL variant states, not just default
   - Document micro-interactions and transitions
   - Note component composition patterns
   - Track consistent spacing/sizing systems

   **PIXEL-PERFECT EXTRACTION**:
   When analyzing ANY component or page:
   - Extract EXACT pixel values for all spacing (padding, margin, gap)
   - Capture precise animation timings (e.g., 200ms) and easing functions (e.g., ease, cubic-bezier)
   - Document ALL color variations including hover/active opacity changes
   - Note exact border widths (1px, 2px) and styles (solid, dashed)
   - Record complete shadow values (x, y, blur, spread, color with rgba)
   - Track z-index layering for proper stacking (z-10, z-20, z-50)
   - Document focus ring styles (color, width, offset)
   - Capture loading and skeleton state animations
   - Extract icon sizes (12px, 16px, 20px, 24px) and stroke widths
   - Note text truncation patterns and line-clamp values
   - Document responsive breakpoint behaviors
   - Record hover transition delays and durations
   - Extract border-radius for every corner case
   - Note overflow behaviors (clip, scroll, hidden)
   - Document backdrop filters and blurs

   **COMPREHENSIVE PAGE ANALYSIS**:
   For every page/screen you encounter:
   - Map the complete layout structure
   - Document header/footer patterns
   - Extract sidebar widths and collapse behaviors
   - Note content max-widths and container patterns
   - Record scroll behaviors and sticky elements
   - Document page transition animations
   - Extract loading state progressions
   - Note empty state designs
   - Capture error state displays
   - Document success state celebrations

3. **Key Requirements**:
   - Match Stripe's design patterns EXACTLY
   - Maintain Cryptrac's brand colors (replace Stripe's #635BFF with our brand)
   - Ensure all components are production-ready
   - Update all existing usages when creating new components

4. **Deliverables for this phase**:
- Complete navigation system
- Mobile navigation
- User menu components

## Important Notes
- DO NOT skip any steps in the phase
- DO implement ALL variants and states specified
- DO test components after creation
- DO update existing code to use new components
- Track your progress with TodoWrite tool
- Run npm run lint and fix all errors at completion of each phase
- Run npm run build and fix all errors at completion of each phase

## Completion Criteria
When complete, provide:
1. List of all files created/modified
2. Component registry updates made
3. Any considerations for next phase
4. Confirmation that all deliverables are complete

**START IMMEDIATELY** by reading the master plan and its implementation guidelines, then analyze previous all previous phases implementation before beginning the Phase 7 implementation to get a sense of where we currently are.

---