# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start Next.js development server (http://localhost:3000)

# Build
npm run build        # Build production-ready application

# Production
npm run start        # Start production server (after build)

# Code Quality
npm run lint         # Run ESLint (Note: ESLint is disabled during builds per next.config.ts)
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Required environment variables:
   - **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **Payment Gateway**: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`
   - **Email**: `SENDGRID_API_KEY`
   - **App URL**: `NEXT_PUBLIC_APP_URL` (e.g., `https://www.cryptrac.com`)

## Architecture Overview

### Core Stack
- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: Radix UI primitives with custom styling
- **Authentication**: Supabase Auth
- **Payment Gateway**: NOWPayments API
- **Email**: SendGrid

### Directory Structure

```
app/
├── api/                    # API routes (Next.js Route Handlers)
│   ├── payments/          # Payment creation and status
│   ├── merchants/         # Merchant management
│   ├── subscriptions/     # Recurring payment logic
│   ├── nowpayments/       # Gateway integration
│   └── webhooks/          # Payment webhook handlers
├── merchant/              # Merchant dashboard pages
│   ├── dashboard/         # Main merchant interface
│   ├── onboarding/        # Merchant setup flow
│   └── subscriptions/     # Subscription management
├── pay/[id]/             # Public payment link page
├── smart-terminal/       # Point-of-sale interface
└── components/           # Shared UI components
    ├── ui/              # Base UI components
    └── layout/          # Layout components

lib/                      # Utility functions and services
├── supabase-*.ts        # Database clients
├── nowpayments-dynamic.ts # Payment gateway SDK
└── email-*.ts           # Email templates and utilities

supabase/
└── functions/           # Edge functions for scheduled jobs
    ├── subscriptions-scheduler/
    └── subscriptions-generate-invoices/
```

### Key Architectural Patterns

#### 1. Payment Flow
- Payment links created via `/api/payments/create`
- Public payment page at `/pay/[id]` handles customer interaction
- NOWPayments processes crypto transactions
- Webhooks at `/api/webhooks/nowpayments` handle payment confirmations
- Transaction status tracked in `transactions` table

#### 2. Merchant System
- Merchants linked to Supabase Auth users
- Wallet addresses stored in `merchants.wallets` JSON field
- Supported currencies determined by configured wallets + stablecoins
- Non-custodial: payments go directly to merchant wallets

#### 3. Subscription System
- Subscriptions create payment links automatically via cron jobs
- Edge functions in `supabase/functions/` handle scheduling
- Invoice generation and notifications managed separately
- Amount overrides supported for custom billing

#### 4. Database Schema
Key tables:
- `merchants`: Business profiles and wallet configurations
- `payment_links`: Payment link definitions
- `transactions`: Payment records and status
- `subscriptions`: Recurring payment configurations
- `subscription_invoices`: Generated subscription invoices

#### 5. Authentication & Authorization
- Supabase Auth handles user authentication
- Merchant access controlled via `user_id` relationships
- API routes verify authentication via Supabase client
- Public payment pages don't require authentication

### Important Implementation Details

1. **Wallet Validation**: Use `/api/wallets/validate` before saving addresses
2. **Currency Support**: Automatic stablecoin associations defined in dashboard components
3. **Fee Structure**: Gateway fees (0.5-1%) handled by NOWPayments, not Cryptrac
4. **PWA Support**: Configured via `next-pwa` in `next.config.ts`
5. **WebAssembly**: Enabled for crypto libraries (Bitcoin, Ethereum address handling)

### API Authentication

Internal API calls between services use `INTERNAL_API_KEY` header for authentication, particularly for subscription system creating payment links.

### Deployment Notes

- ESLint errors ignored during builds (see `next.config.ts`)
- PWA disabled in development mode
- Redirects configured for legacy wallet settings routes
- Image optimization configured for QR code generation

## Testing

No test framework currently configured. Tests would need to be added with a testing library like Jest or Vitest.

## Common Development Tasks

### Adding a New Cryptocurrency
1. Update wallet validation in `/api/wallets/validate`
2. Add currency to `CURRENCY_NAMES` mappings in dashboard components
3. Update stablecoin associations if applicable
4. Ensure NOWPayments supports the currency

### Creating New API Endpoints
1. Add route handler in `app/api/` directory
2. Use Supabase client for database operations
3. Implement proper authentication checks
4. Return consistent JSON response format

### Modifying Payment Flow
1. Payment link creation: `/api/payments/create`
2. Payment page UI: `/app/pay/[id]/page.tsx`
3. Status updates: `/api/payments/[id]/status`
4. Webhook processing: `/api/webhooks/nowpayments`