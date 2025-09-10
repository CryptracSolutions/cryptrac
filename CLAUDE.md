# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start Next.js development server (http://localhost:3000)
                    # Enables hot-reload, TypeScript type checking, and Tailwind compilation
                    # Server automatically restarts on configuration changes

# Build
npm run build        # Build production-ready application
                    # Generates optimized bundles, pre-renders static pages
                    # Validates TypeScript types and performs static analysis
                    # Output stored in `.next/` directory

# Production
npm run start        # Start production server (after build)
                    # Serves the built application from `.next/` directory
                    # Requires `npm run build` to be run first
                    # Uses production optimizations and caching

# Code Quality
npm run lint         # Run ESLint (Note: ESLint is disabled during builds per next.config.ts)
                    # Checks TypeScript/JavaScript code for style and potential errors
                    # Configuration in `.eslintrc.json` with Next.js and TypeScript rules
                    # Can be run with `--fix` flag to auto-correct issues
```

### Development Best Practices
- Use `npm run build` locally before committing to catch build-time errors early
- Run `npm run lint` before pushing to maintain code quality standards
- The development server supports Fast Refresh for React components

## Environment Setup

### Quick Start
1. Copy `.env.example` to `.env.local`
2. Configure required environment variables (see below)
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start development server

### Required Environment Variables

#### Database & Authentication (Supabase)
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL (e.g., `https://abc123.supabase.co`)
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Public anon key for client-side database access
- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key for server-side operations with elevated privileges

#### Payment Processing (NOWPayments)
- **`NOWPAYMENTS_API_KEY`**: API key for creating payments and checking status
- **`NOWPAYMENTS_IPN_SECRET`**: Secret key for validating webhook signatures from NOWPayments
- **`INTERNAL_API_KEY`**: Used for internal API calls between services (generate a secure random string)

#### Email Communications (SendGrid)
- **`SENDGRID_API_KEY`**: API key for sending transactional emails (payment confirmations, invoices)
- **`SENDGRID_FROM_EMAIL`**: Verified sender email address in SendGrid

#### Application Configuration
- **`NEXT_PUBLIC_APP_URL`**: Base URL of your application (e.g., `https://www.cryptrac.com` or `http://localhost:3000` for development)

### Environment File Examples

**Development (`.env.local`)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NOWPAYMENTS_API_KEY=your-nowpayments-api-key
NOWPAYMENTS_IPN_SECRET=your-nowpayments-ipn-secret
SENDGRID_API_KEY=SG.your-sendgrid-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=your-secure-random-string
```

**Production**:
- Use secure, production-specific API keys
- Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
- Consider using environment variable management services for sensitive keys

## Architecture Overview

### Core Stack

#### Frontend & Framework
- **Framework**: Next.js 15.3.5 with App Router
  - Server-side rendering (SSR) and static site generation (SSG)
  - API routes for backend functionality
  - Client-side routing with optimized navigation
  - Built-in image optimization and font loading

#### Language & Type Safety
- **Language**: TypeScript
  - Strict type checking enabled
  - Custom type definitions in `types/` directory
  - Interface definitions for API responses and database models

#### Database & Backend
- **Database**: Supabase (PostgreSQL)
  - Real-time subscriptions for live data updates
  - Row-level security (RLS) policies for data access control
  - Built-in authentication and user management
  - Edge functions for serverless compute

#### Styling & UI
- **Styling**: Tailwind CSS v4 with custom design tokens
  - Utility-first CSS framework
  - Custom color palette and spacing scale
  - Responsive design patterns and breakpoints
- **UI Components**: Radix UI primitives with custom styling
  - Accessible, unstyled components as foundation
  - Custom theming and design system implementation
  - Consistent interaction patterns across the application

#### External Services
- **Authentication**: Supabase Auth
  - Email/password authentication
  - Social login providers (if configured)
  - Session management and user state
- **Payment Gateway**: NOWPayments API
  - Cryptocurrency payment processing
  - Multiple coin support (Bitcoin, Ethereum, stablecoins, etc.)
  - Webhook-based payment confirmations
- **Email**: SendGrid
  - Transactional email delivery
  - Template-based email composition
  - Delivery tracking and analytics

### Directory Structure

```
app/
├── api/                    # API routes (Next.js Route Handlers)
│   ├── payments/          # Payment creation, status updates, and management
│   │   ├── create/        # POST endpoint for creating new payment links
│   │   ├── [id]/          # GET/PUT endpoints for specific payment operations
│   │   └── status/        # Payment status polling and updates
│   ├── merchants/         # Merchant profile and business management
│   │   ├── profile/       # Merchant profile CRUD operations
│   │   ├── wallets/       # Wallet address management and validation
│   │   └── settings/      # Merchant preferences and configurations
│   ├── subscriptions/     # Recurring payment and subscription logic
│   │   ├── create/        # Subscription setup and configuration
│   │   ├── invoices/      # Invoice generation and management
│   │   └── webhooks/      # Subscription-related webhook processing
│   ├── nowpayments/       # Direct NOWPayments gateway integration
│   │   ├── currencies/    # Supported currency fetching
│   │   ├── estimate/      # Payment amount estimation
│   │   └── status/        # Payment status from NOWPayments
│   ├── webhooks/          # External webhook handlers
│   │   ├── nowpayments/   # Payment confirmation webhooks
│   │   └── supabase/      # Database change notifications
│   └── wallets/           # Cryptocurrency wallet operations
│       └── validate/      # Wallet address validation endpoint
├── merchant/              # Merchant-facing dashboard and tools
│   ├── dashboard/         # Main merchant interface and analytics
│   │   ├── page.tsx       # Dashboard overview with key metrics
│   │   ├── payments/      # Payment history and management
│   │   └── analytics/     # Revenue analytics and reporting
│   ├── onboarding/        # New merchant setup and configuration flow
│   │   ├── page.tsx       # Welcome and getting started
│   │   ├── profile/       # Business profile setup
│   │   ├── wallets/       # Wallet configuration and verification
│   │   └── complete/      # Onboarding completion and next steps
│   ├── subscriptions/     # Subscription and recurring payment management
│   │   ├── page.tsx       # Subscription list and overview
│   │   ├── create/        # New subscription setup
│   │   ├── [id]/          # Individual subscription management
│   │   └── invoices/      # Invoice history and management
│   └── settings/          # Merchant account settings and preferences
├── pay/[id]/             # Public payment link pages (customer-facing)
│   ├── page.tsx          # Main payment interface
│   ├── success/          # Payment completion confirmation
│   └── components/       # Payment-specific UI components
├── smart-terminal/       # Point-of-sale interface for in-person payments
│   ├── page.tsx          # Terminal interface
│   ├── scanner/          # QR code scanning functionality
│   └── receipt/          # Digital receipt generation
├── components/           # Shared UI components and layouts
│   ├── ui/              # Base UI components (buttons, forms, modals)
│   │   ├── button.tsx    # Reusable button component
│   │   ├── form.tsx      # Form components and validation
│   │   ├── modal.tsx     # Modal and dialog components
│   │   └── ...           # Additional UI primitives
│   ├── layout/          # Layout components and navigation
│   │   ├── header.tsx    # Application header and navigation
│   │   ├── sidebar.tsx   # Dashboard sidebar navigation
│   │   └── footer.tsx    # Application footer
│   ├── payments/        # Payment-related components
│   └── merchants/       # Merchant-specific components
├── globals.css           # Global styles and Tailwind CSS imports
├── layout.tsx           # Root layout component
├── page.tsx             # Homepage and landing page
└── not-found.tsx        # 404 error page

lib/                      # Utility functions, services, and shared logic
├── supabase-client.ts   # Client-side Supabase configuration
├── supabase-server.ts   # Server-side Supabase configuration
├── supabase-admin.ts    # Admin/service role Supabase client
├── nowpayments-dynamic.ts # NOWPayments API integration and SDK wrapper
├── email-client.ts      # SendGrid email client configuration
├── email-templates.ts   # Email template definitions and rendering
├── utils.ts             # General utility functions
├── validators.ts        # Input validation schemas and functions
├── constants.ts         # Application constants and configuration
├── types.ts             # TypeScript type definitions
└── hooks/               # Custom React hooks
    ├── useAuth.ts       # Authentication state management
    ├── usePayments.ts   # Payment-related state and operations
    └── useMerchant.ts   # Merchant profile and settings

types/                    # TypeScript type definitions
├── api.ts               # API request/response types
├── database.ts          # Supabase database types
├── payments.ts          # Payment and transaction types
└── merchants.ts         # Merchant and business types

public/                   # Static assets
├── icons/               # Application icons and favicons
├── images/              # Static images and graphics
└── manifest.json        # PWA manifest configuration

supabase/
├── config.toml          # Supabase project configuration
├── migrations/          # Database migration files
│   ├── 001_initial.sql  # Initial database schema
│   ├── 002_merchants.sql # Merchant tables and relationships
│   └── ...              # Additional migrations
└── functions/           # Edge functions for scheduled jobs and automation
    ├── subscriptions-scheduler/      # Cron job for subscription processing
    │   ├── index.ts     # Main scheduler logic
    │   └── deno.json    # Deno configuration
    └── subscriptions-generate-invoices/  # Invoice generation automation
        ├── index.ts     # Invoice creation logic
        └── deno.json    # Deno configuration
```

### Key Architectural Patterns

#### 1. Payment Flow

**Payment Link Creation**:
- Merchants create payment links via `/api/payments/create`
- Links can be one-time or subscription-based
- Support for multiple cryptocurrencies based on merchant wallet configuration
- QR code generation for mobile payments

**Customer Payment Process**:
- Public payment page at `/pay/[id]` handles customer interaction
- Real-time currency rate fetching and amount calculation
- Integration with NOWPayments for secure crypto payment processing
- Support for partial payments and overpayments

**Payment Processing**:
- NOWPayments processes crypto transactions on various blockchains
- Webhook notifications sent to `/api/webhooks/nowpayments` for status updates
- Transaction status tracked in `transactions` table with real-time updates
- Automatic email notifications for payment confirmations

**Status Management**:
- Payment statuses: pending, confirming, confirmed, failed, expired
- Real-time status updates via Supabase subscriptions
- Automatic timeout handling for expired payments
- Support for partial payment scenarios

#### 2. Merchant System

**Merchant Onboarding**:
- New merchants linked to Supabase Auth users
- Step-by-step onboarding process with profile and wallet setup
- Email verification and business profile validation
- Guided wallet configuration with address validation

**Wallet Management**:
- Wallet addresses stored in `merchants.wallets` JSON field
- Support for multiple cryptocurrencies per merchant
- Address validation via blockchain APIs before storage
- Automatic stablecoin associations (USDC, USDT, DAI)

**Currency Support**:
- Supported currencies determined by configured wallets + automatic stablecoins
- Dynamic currency list based on NOWPayments availability
- Real-time exchange rate fetching for accurate pricing
- Support for both major cryptocurrencies and stablecoins

**Non-Custodial Architecture**:
- Payments go directly to merchant wallets (no intermediary custody)
- Cryptrac never holds or controls merchant funds
- Merchants maintain full control of their private keys
- Enhanced security through decentralized payment processing

#### 3. Subscription System

**Subscription Creation**:
- Merchants set up recurring payment schedules (daily, weekly, monthly, yearly)
- Flexible amount configuration with override capabilities
- Customer subscription management and cancellation options
- Integration with payment link system for seamless billing

**Automated Processing**:
- Edge functions in `supabase/functions/` handle scheduled processing
- Cron jobs create payment links automatically based on subscription schedules
- Invoice generation and customer notification automation
- Failed payment retry logic and dunning management

**Invoice Management**:
- Invoice generation with PDF creation capabilities
- Email delivery via SendGrid with branded templates
- Payment tracking linked to subscription invoices
- Historical invoice access and re-sending capabilities

**Billing Flexibility**:
- Amount overrides for custom billing scenarios
- Proration support for mid-cycle changes
- Multiple subscription tiers and pricing models
- Support for trial periods and promotional pricing

#### 4. Database Schema

**Core Tables**:

**`merchants`**: Business profiles and wallet configurations
- `id`: UUID primary key
- `user_id`: Reference to Supabase Auth user
- `business_name`, `business_email`: Company information
- `wallets`: JSON object storing wallet addresses by currency
- `settings`: JSON object for merchant preferences
- `created_at`, `updated_at`: Timestamps

**`payment_links`**: Payment link definitions and metadata
- `id`: UUID primary key
- `merchant_id`: Foreign key to merchants table
- `title`, `description`: Payment details
- `amount`, `currency`: Pricing information
- `expires_at`: Expiration timestamp
- `is_subscription`: Boolean for recurring payments
- `subscription_config`: JSON for subscription settings

**`transactions`**: Payment records and status tracking
- `id`: UUID primary key
- `payment_link_id`: Foreign key to payment_links
- `nowpayments_id`: External payment processor ID
- `amount`, `currency`: Transaction amounts
- `status`: Payment status enum
- `blockchain_hash`: Transaction hash on blockchain
- `confirmed_at`: Confirmation timestamp

**`subscriptions`**: Recurring payment configurations
- `id`: UUID primary key
- `payment_link_id`: Foreign key to payment_links
- `customer_email`: Subscriber contact information
- `billing_cycle`: Frequency (daily, weekly, monthly, yearly)
- `next_billing_date`: Next scheduled payment
- `status`: Active, paused, cancelled
- `amount_override`: Custom billing amount

**`subscription_invoices`**: Generated subscription invoices
- `id`: UUID primary key
- `subscription_id`: Foreign key to subscriptions
- `invoice_number`: Unique invoice identifier
- `amount`, `currency`: Invoice totals
- `due_date`: Payment due date
- `status`: Draft, sent, paid, overdue
- `payment_link_id`: Generated payment link for invoice

**Relationships and Indexes**:
- Foreign key constraints maintain referential integrity
- Indexes on frequently queried fields (user_id, status, created_at)
- Row-level security policies for data access control
- Composite indexes for complex queries (merchant_id + status)

#### 5. Authentication & Authorization

**User Authentication**:
- Supabase Auth handles user registration and login
- Email/password authentication with email verification
- Session management with automatic token refresh
- Support for social login providers (configurable)

**Authorization Patterns**:
- Merchant access controlled via `user_id` relationships in database
- Row-level security (RLS) policies enforce data isolation
- API routes verify authentication via Supabase client
- Role-based access control for different user types

**Security Measures**:
- Public payment pages don't require authentication for customer convenience
- Internal API endpoints protected with INTERNAL_API_KEY
- CSRF protection on state-changing operations
- Rate limiting on payment creation endpoints

**Session Management**:
- Automatic session refresh for logged-in users
- Secure session storage using HTTP-only cookies
- Session expiration handling with graceful logout
- Multi-device session support with revocation capabilities

### Important Implementation Details

#### 1. Wallet Validation
- **Endpoint**: `/api/wallets/validate`
- **Purpose**: Validate cryptocurrency wallet addresses before storage
- **Implementation**: Uses blockchain-specific validation libraries
- **Supported Networks**: Bitcoin, Ethereum, Litecoin, and ERC-20 tokens
- **Usage**: Always call before saving wallet addresses to prevent invalid configurations

#### 2. Currency Support and Stablecoin Associations
- **Dynamic Currency Lists**: Fetched from NOWPayments API for real-time availability
- **Automatic Stablecoin Associations**: Dashboard components automatically associate USDC, USDT, DAI with configured wallets
- **Currency Name Mappings**: Defined in `CURRENCY_NAMES` constants for user-friendly display
- **Exchange Rates**: Real-time rate fetching for accurate payment amount calculations

#### 3. Fee Structure and Pricing
- **Gateway Fees**: 0.5-1% fees handled directly by NOWPayments, transparent to merchants
- **No Platform Fees**: Cryptrac doesn't charge additional fees on top of gateway fees
- **Transparent Pricing**: All fees disclosed upfront during payment creation
- **Merchant Benefits**: Direct payments to merchant wallets with minimal processing overhead

#### 4. PWA (Progressive Web App) Support
- **Configuration**: Implemented via `next-pwa` plugin in `next.config.ts`
- **Offline Capability**: Service worker caching for offline payment page access
- **Mobile Optimization**: App-like experience on mobile devices
- **Installation**: Users can install Cryptrac as a standalone app
- **Development Mode**: PWA features disabled during development for easier debugging

#### 5. WebAssembly Integration
- **Purpose**: Enabled for cryptocurrency libraries requiring WebAssembly
- **Use Cases**: Bitcoin and Ethereum address validation, cryptographic operations
- **Performance**: WebAssembly provides near-native performance for crypto operations
- **Browser Support**: Fallback implementations for unsupported browsers

#### 6. Real-time Features
- **Supabase Subscriptions**: Real-time payment status updates on payment pages
- **Live Currency Rates**: Dynamic rate updates for accurate pricing
- **Payment Confirmations**: Instant notifications when payments are confirmed
- **Dashboard Updates**: Real-time merchant dashboard updates for new payments

### API Authentication

**Internal Service Authentication**:
- Internal API calls between services use `INTERNAL_API_KEY` header for authentication
- Primary use case: Subscription system creating payment links automatically
- Key should be a cryptographically secure random string (minimum 32 characters)
- Different from user authentication - used for server-to-server communication

**User Authentication Flow**:
- Client-side: Supabase Auth client manages user sessions
- Server-side: API routes validate sessions using Supabase server client
- Protected routes redirect unauthenticated users to login
- Session tokens automatically refreshed for seamless user experience

**Webhook Authentication**:
- NOWPayments webhooks validated using IPN secret signature verification
- Prevents unauthorized webhook calls and ensures data integrity
- Signature validation logic in webhook handlers
- Failed authentication results in webhook rejection

### Deployment Notes

#### Build Configuration
- **ESLint**: Errors ignored during builds (configured in `next.config.ts`)
  - Allows builds to complete even with linting issues
  - Recommended to fix linting issues before deployment
  - Linting still available via `npm run lint` command

#### PWA Configuration
- **Development**: PWA features disabled in development mode for easier debugging
- **Production**: Full PWA capabilities enabled with service worker caching
- **Caching Strategy**: Optimized for payment page availability and performance

#### Routing and Redirects
- **Legacy Routes**: Redirects configured for legacy wallet settings routes
- **Clean URLs**: SEO-friendly URLs for payment pages and merchant dashboard
- **Error Handling**: Custom 404 and error pages for better user experience

#### Performance Optimizations
- **Image Optimization**: Configured for QR code generation and merchant logos
- **Bundle Splitting**: Automatic code splitting for optimal loading performance
- **Static Generation**: Pre-rendering of public pages for faster initial loads
- **CDN Ready**: Optimized for deployment with CDN services

#### Environment-Specific Considerations
- **Development**: Hot reloading, detailed error messages, debugging tools enabled
- **Staging**: Production-like configuration with staging API endpoints
- **Production**: Optimized builds, error tracking, performance monitoring

## Testing

### Current State
No test framework currently configured. The application would benefit from comprehensive testing coverage.

### Recommended Testing Strategy

#### Unit Testing
- **Framework**: Jest or Vitest for unit testing
- **Coverage**: Utility functions, API route handlers, payment logic
- **Mock Strategy**: Mock external APIs (NOWPayments, Supabase, SendGrid)
- **Focus Areas**: Payment calculations, wallet validation, currency conversions

#### Integration Testing
- **API Testing**: Test API endpoints with real database interactions
- **Payment Flow**: End-to-end payment creation and processing
- **Webhook Testing**: Simulate NOWPayments webhook calls
- **Database Testing**: Test Supabase queries and mutations

#### Frontend Testing
- **Framework**: React Testing Library with Jest
- **Component Testing**: UI component behavior and rendering
- **User Interactions**: Form submissions, payment flows, navigation
- **Responsive Testing**: Mobile and desktop layout validation

#### E2E Testing
- **Framework**: Playwright or Cypress
- **Critical Paths**: Complete payment flows, merchant onboarding
- **Cross-Browser**: Testing across different browsers and devices
- **Performance**: Load testing for payment processing

### Testing Setup Recommendations
```bash
# Install testing dependencies
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom

# Create test configuration
jest.config.js
setupTests.ts

# Add test scripts to package.json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

## Common Development Tasks

### Adding a New Cryptocurrency

#### Step-by-Step Process
1. **Update Wallet Validation** (`/api/wallets/validate`):
   ```typescript
   // Add validation logic for new cryptocurrency
   case 'NEW_COIN':
     return validateNewCoinAddress(address);
   ```

2. **Add Currency Mapping** (dashboard components):
   ```typescript
   const CURRENCY_NAMES = {
     ...existing_currencies,
     'new_coin': 'New Coin (NEW)',
   };
   ```

3. **Configure Stablecoin Associations** (if applicable):
   - Update automatic stablecoin pairing logic
   - Ensure proper currency grouping in UI

4. **Verify NOWPayments Support**:
   - Check NOWPayments API for currency availability
   - Test payment creation with new currency
   - Validate webhook handling for new coin type

5. **Update Type Definitions**:
   ```typescript
   type SupportedCurrency = 'btc' | 'eth' | 'new_coin' | ...;
   ```

#### Testing New Currency Integration
- Test wallet address validation
- Verify payment link creation
- Test payment processing flow
- Validate webhook processing

### Creating New API Endpoints

#### Route Handler Structure
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Database operations
    const { data, error: dbError } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. Return consistent response
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Best Practices
- **Authentication**: Always verify user authentication for protected endpoints
- **Error Handling**: Consistent error response format across all endpoints
- **Validation**: Validate input parameters using type-safe schemas
- **Database Access**: Use appropriate Supabase client (client/server/admin)
- **Response Format**: Standardize response structure for frontend consumption

#### Common Patterns
- **Pagination**: Implement offset/limit for large datasets
- **Filtering**: Support query parameters for data filtering
- **Rate Limiting**: Implement rate limiting for resource-intensive endpoints
- **Caching**: Add appropriate caching headers for cacheable responses

### Modifying Payment Flow

#### Key Components to Update

1. **Payment Link Creation** (`/api/payments/create`):
   - Input validation and sanitization
   - Currency support and exchange rate fetching
   - Database record creation
   - Response formatting with payment link URL

2. **Payment Page UI** (`/app/pay/[id]/page.tsx`):
   - Real-time payment status updates
   - QR code generation for mobile payments
   - Currency selection and amount display
   - Progress indicators and user feedback

3. **Status Updates** (`/api/payments/[id]/status`):
   - NOWPayments API integration for status checking
   - Database synchronization
   - Real-time updates via Supabase subscriptions
   - Error handling and retry logic

4. **Webhook Processing** (`/api/webhooks/nowpayments`):
   - Signature verification for security
   - Payment status interpretation
   - Database updates and notifications
   - Email trigger for payment confirmations

#### Flow Modification Examples

**Adding New Payment Status**:
```typescript
// Update type definitions
type PaymentStatus = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'new_status';

// Update database schema
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS new_status_field;

// Update webhook handler
switch (payment.payment_status) {
  case 'new_status':
    // Handle new status logic
    break;
}
```

**Implementing Payment Retries**:
```typescript
// Add retry logic to payment processing
const MAX_RETRIES = 3;
let retryCount = 0;

while (retryCount < MAX_RETRIES) {
  try {
    const result = await processPayment(paymentData);
    break; // Success, exit retry loop
  } catch (error) {
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      throw error; // Final failure
    }
    await delay(1000 * retryCount); // Exponential backoff
  }
}
```

#### Testing Payment Flow Changes
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete payment flows
- **Webhook Testing**: Use NOWPayments sandbox for webhook validation
- **User Testing**: Manual testing of customer payment experience

### Database Management

#### Migration Best Practices
```sql
-- Example migration for new feature
-- migrations/003_add_feature.sql

-- Add new table
CREATE TABLE feature_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own features"
ON feature_table FOR SELECT
USING (merchant_id IN (
  SELECT id FROM merchants WHERE user_id = auth.uid()
));

-- Add indexes
CREATE INDEX idx_feature_table_merchant_id ON feature_table(merchant_id);
CREATE INDEX idx_feature_table_created_at ON feature_table(created_at);
```

#### Query Optimization Tips
- Use proper indexes for frequently queried columns
- Implement pagination for large datasets
- Use Supabase's real-time features for live updates
- Optimize joins and use appropriate query patterns

### Error Handling and Monitoring

#### Error Handling Patterns
```typescript
// Consistent error handling
try {
  const result = await riskyOperation();
  return { data: result, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  
  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
  
  return { 
    data: null, 
    error: 'Operation failed. Please try again.' 
  };
}
```

#### Monitoring Recommendations
- **Error Tracking**: Integrate Sentry or similar service
- **Performance Monitoring**: Track API response times
- **Payment Monitoring**: Alert on payment failures
- **Database Monitoring**: Track query performance and errors

## Security Considerations

### Data Protection
- **Sensitive Data**: Never log or expose API keys, wallet private keys, or user sensitive information
- **Input Validation**: Sanitize all user inputs to prevent injection attacks
- **Rate Limiting**: Implement rate limiting on payment creation and API endpoints
- **HTTPS**: Always use HTTPS in production for encrypted communication

### Cryptocurrency Security
- **Non-Custodial**: Application never handles private keys or controls user funds
- **Address Validation**: Validate wallet addresses before storage to prevent loss of funds
- **Payment Verification**: Always verify payments through blockchain or payment processor
- **Webhook Security**: Validate webhook signatures to prevent fraudulent notifications

### Authentication Security
- **Session Management**: Secure session handling with proper expiration
- **Password Policies**: Enforce strong password requirements
- **Two-Factor Authentication**: Consider implementing 2FA for merchant accounts
- **Account Lockout**: Implement account lockout after failed login attempts

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Utilize Next.js automatic code splitting
- **Image Optimization**: Use Next.js Image component for optimized loading
- **Lazy Loading**: Implement lazy loading for non-critical components
- **Caching**: Implement proper caching strategies for API responses

### Backend Performance
- **Database Optimization**: Use proper indexes and query optimization
- **API Response Caching**: Cache frequently requested data
- **Connection Pooling**: Optimize database connection usage
- **Background Processing**: Use edge functions for time-intensive operations

### Monitoring and Metrics
- **Performance Metrics**: Track page load times and API response times
- **User Analytics**: Monitor user behavior and conversion rates
- **Error Rates**: Track and alert on error rate increases
- **Payment Success Rates**: Monitor payment completion rates

### Development Best Practices
- Use `npm run build` locally before committing to catch build-time errors early
- Run `npm run lint` before pushing to maintain code quality standards
- The development server supports Fast Refresh for React components

## Environment Setup

### Quick Start
1. Copy `.env.example` to `.env.local`
2. Configure required environment variables (see below)
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start development server

### Required Environment Variables

#### Database & Authentication (Supabase)
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL (e.g., `https://abc123.supabase.co`)
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Public anon key for client-side database access
- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key for server-side operations with elevated privileges

#### Payment Processing (NOWPayments)
- **`NOWPAYMENTS_API_KEY`**: API key for creating payments and checking status
- **`NOWPAYMENTS_IPN_SECRET`**: Secret key for validating webhook signatures from NOWPayments
- **`INTERNAL_API_KEY`**: Used for internal API calls between services (generate a secure random string)

#### Email Communications (SendGrid)
- **`SENDGRID_API_KEY`**: API key for sending transactional emails (payment confirmations, invoices)
- **`SENDGRID_FROM_EMAIL`**: Verified sender email address in SendGrid

#### Application Configuration
- **`NEXT_PUBLIC_APP_URL`**: Base URL of your application (e.g., `https://www.cryptrac.com` or `http://localhost:3000` for development)

### Environment File Examples

**Development (`.env.local`)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NOWPAYMENTS_API_KEY=your-nowpayments-api-key
NOWPAYMENTS_IPN_SECRET=your-nowpayments-ipn-secret
SENDGRID_API_KEY=SG.your-sendgrid-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=your-secure-random-string
```

**Production**:
- Use secure, production-specific API keys
- Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
- Consider using environment variable management services for sensitive keys

## Architecture Overview

### Core Stack

#### Frontend & Framework
- **Framework**: Next.js 15.3.5 with App Router
  - Server-side rendering (SSR) and static site generation (SSG)
  - API routes for backend functionality
  - Client-side routing with optimized navigation
  - Built-in image optimization and font loading

#### Language & Type Safety
- **Language**: TypeScript
  - Strict type checking enabled
  - Custom type definitions in `types/` directory
  - Interface definitions for API responses and database models

#### Database & Backend
- **Database**: Supabase (PostgreSQL)
  - Real-time subscriptions for live data updates
  - Row-level security (RLS) policies for data access control
  - Built-in authentication and user management
  - Edge functions for serverless compute

#### Styling & UI
- **Styling**: Tailwind CSS v4 with custom design tokens
  - Utility-first CSS framework
  - Custom color palette and spacing scale
  - Responsive design patterns and breakpoints
- **UI Components**: Radix UI primitives with custom styling
  - Accessible, unstyled components as foundation
  - Custom theming and design system implementation
  - Consistent interaction patterns across the application

#### External Services
- **Authentication**: Supabase Auth
  - Email/password authentication
  - Social login providers (if configured)
  - Session management and user state
- **Payment Gateway**: NOWPayments API
  - Cryptocurrency payment processing
  - Multiple coin support (Bitcoin, Ethereum, stablecoins, etc.)
  - Webhook-based payment confirmations
- **Email**: SendGrid
  - Transactional email delivery
  - Template-based email composition
  - Delivery tracking and analytics

### Directory Structure

```
app/
├── api/                    # API routes (Next.js Route Handlers)
│   ├── payments/          # Payment creation, status updates, and management
│   │   ├── create/        # POST endpoint for creating new payment links
│   │   ├── [id]/          # GET/PUT endpoints for specific payment operations
│   │   └── status/        # Payment status polling and updates
│   ├── merchants/         # Merchant profile and business management
│   │   ├── profile/       # Merchant profile CRUD operations
│   │   ├── wallets/       # Wallet address management and validation
│   │   └── settings/      # Merchant preferences and configurations
│   ├── subscriptions/     # Recurring payment and subscription logic
│   │   ├── create/        # Subscription setup and configuration
│   │   ├── invoices/      # Invoice generation and management
│   │   └── webhooks/      # Subscription-related webhook processing
│   ├── nowpayments/       # Direct NOWPayments gateway integration
│   │   ├── currencies/    # Supported currency fetching
│   │   ├── estimate/      # Payment amount estimation
│   │   └── status/        # Payment status from NOWPayments
│   ├── webhooks/          # External webhook handlers
│   │   ├── nowpayments/   # Payment confirmation webhooks
│   │   └── supabase/      # Database change notifications
│   └── wallets/           # Cryptocurrency wallet operations
│       └── validate/      # Wallet address validation endpoint
├── merchant/              # Merchant-facing dashboard and tools
│   ├── dashboard/         # Main merchant interface and analytics
│   │   ├── page.tsx       # Dashboard overview with key metrics
│   │   ├── payments/      # Payment history and management
│   │   └── analytics/     # Revenue analytics and reporting
│   ├── onboarding/        # New merchant setup and configuration flow
│   │   ├── page.tsx       # Welcome and getting started
│   │   ├── profile/       # Business profile setup
│   │   ├── wallets/       # Wallet configuration and verification
│   │   └── complete/      # Onboarding completion and next steps
│   ├── subscriptions/     # Subscription and recurring payment management
│   │   ├── page.tsx       # Subscription list and overview
│   │   ├── create/        # New subscription setup
│   │   ├── [id]/          # Individual subscription management
│   │   └── invoices/      # Invoice history and management
│   └── settings/          # Merchant account settings and preferences
├── pay/[id]/             # Public payment link pages (customer-facing)
│   ├── page.tsx          # Main payment interface
│   ├── success/          # Payment completion confirmation
│   └── components/       # Payment-specific UI components
├── smart-terminal/       # Point-of-sale interface for in-person payments
│   ├── page.tsx          # Terminal interface
│   ├── scanner/          # QR code scanning functionality
│   └── receipt/          # Digital receipt generation
├── components/           # Shared UI components and layouts
│   ├── ui/              # Base UI components (buttons, forms, modals)
│   │   ├── button.tsx    # Reusable button component
│   │   ├── form.tsx      # Form components and validation
│   │   ├── modal.tsx     # Modal and dialog components
│   │   └── ...           # Additional UI primitives
│   ├── layout/          # Layout components and navigation
│   │   ├── header.tsx    # Application header and navigation
│   │   ├── sidebar.tsx   # Dashboard sidebar navigation
│   │   └── footer.tsx    # Application footer
│   ├── payments/        # Payment-related components
│   └── merchants/       # Merchant-specific components
├── globals.css           # Global styles and Tailwind CSS imports
├── layout.tsx           # Root layout component
├── page.tsx             # Homepage and landing page
└── not-found.tsx        # 404 error page

lib/                      # Utility functions, services, and shared logic
├── supabase-client.ts   # Client-side Supabase configuration
├── supabase-server.ts   # Server-side Supabase configuration
├── supabase-admin.ts    # Admin/service role Supabase client
├── nowpayments-dynamic.ts # NOWPayments API integration and SDK wrapper
├── email-client.ts      # SendGrid email client configuration
├── email-templates.ts   # Email template definitions and rendering
├── utils.ts             # General utility functions
├── validators.ts        # Input validation schemas and functions
├── constants.ts         # Application constants and configuration
├── types.ts             # TypeScript type definitions
└── hooks/               # Custom React hooks
    ├── useAuth.ts       # Authentication state management
    ├── usePayments.ts   # Payment-related state and operations
    └── useMerchant.ts   # Merchant profile and settings

types/                    # TypeScript type definitions
├── api.ts               # API request/response types
├── database.ts          # Supabase database types
├── payments.ts          # Payment and transaction types
└── merchants.ts         # Merchant and business types

public/                   # Static assets
├── icons/               # Application icons and favicons
├── images/              # Static images and graphics
└── manifest.json        # PWA manifest configuration

supabase/
├── config.toml          # Supabase project configuration
├── migrations/          # Database migration files
│   ├── 001_initial.sql  # Initial database schema
│   ├── 002_merchants.sql # Merchant tables and relationships
│   └── ...              # Additional migrations
└── functions/           # Edge functions for scheduled jobs and automation
    ├── subscriptions-scheduler/      # Cron job for subscription processing
    │   ├── index.ts     # Main scheduler logic
    │   └── deno.json    # Deno configuration
    └── subscriptions-generate-invoices/  # Invoice generation automation
        ├── index.ts     # Invoice creation logic
        └── deno.json    # Deno configuration
```

### Key Architectural Patterns

#### 1. Payment Flow

**Payment Link Creation**:
- Merchants create payment links via `/api/payments/create`
- Links can be one-time or subscription-based
- Support for multiple cryptocurrencies based on merchant wallet configuration
- QR code generation for mobile payments

**Customer Payment Process**:
- Public payment page at `/pay/[id]` handles customer interaction
- Real-time currency rate fetching and amount calculation
- Integration with NOWPayments for secure crypto payment processing
- Support for partial payments and overpayments

**Payment Processing**:
- NOWPayments processes crypto transactions on various blockchains
- Webhook notifications sent to `/api/webhooks/nowpayments` for status updates
- Transaction status tracked in `transactions` table with real-time updates
- Automatic email notifications for payment confirmations

**Status Management**:
- Payment statuses: pending, confirming, confirmed, failed, expired
- Real-time status updates via Supabase subscriptions
- Automatic timeout handling for expired payments
- Support for partial payment scenarios

#### 2. Merchant System

**Merchant Onboarding**:
- New merchants linked to Supabase Auth users
- Step-by-step onboarding process with profile and wallet setup
- Email verification and business profile validation
- Guided wallet configuration with address validation

**Wallet Management**:
- Wallet addresses stored in `merchants.wallets` JSON field
- Support for multiple cryptocurrencies per merchant
- Address validation via blockchain APIs before storage
- Automatic stablecoin associations (USDC, USDT, DAI)

**Currency Support**:
- Supported currencies determined by configured wallets + automatic stablecoins
- Dynamic currency list based on NOWPayments availability
- Real-time exchange rate fetching for accurate pricing
- Support for both major cryptocurrencies and stablecoins

**Non-Custodial Architecture**:
- Payments go directly to merchant wallets (no intermediary custody)
- Cryptrac never holds or controls merchant funds
- Merchants maintain full control of their private keys
- Enhanced security through decentralized payment processing

#### 3. Subscription System

**Subscription Creation**:
- Merchants set up recurring payment schedules (daily, weekly, monthly, yearly)
- Flexible amount configuration with override capabilities
- Customer subscription management and cancellation options
- Integration with payment link system for seamless billing

**Automated Processing**:
- Edge functions in `supabase/functions/` handle scheduled processing
- Cron jobs create payment links automatically based on subscription schedules
- Invoice generation and customer notification automation
- Failed payment retry logic and dunning management

**Invoice Management**:
- Invoice generation with PDF creation capabilities
- Email delivery via SendGrid with branded templates
- Payment tracking linked to subscription invoices
- Historical invoice access and re-sending capabilities

**Billing Flexibility**:
- Amount overrides for custom billing scenarios
- Proration support for mid-cycle changes
- Multiple subscription tiers and pricing models
- Support for trial periods and promotional pricing

#### 4. Database Schema

**Core Tables**:

**`merchants`**: Business profiles and wallet configurations
- `id`: UUID primary key
- `user_id`: Reference to Supabase Auth user
- `business_name`, `business_email`: Company information
- `wallets`: JSON object storing wallet addresses by currency
- `settings`: JSON object for merchant preferences
- `created_at`, `updated_at`: Timestamps

**`payment_links`**: Payment link definitions and metadata
- `id`: UUID primary key
- `merchant_id`: Foreign key to merchants table
- `title`, `description`: Payment details
- `amount`, `currency`: Pricing information
- `expires_at`: Expiration timestamp
- `is_subscription`: Boolean for recurring payments
- `subscription_config`: JSON for subscription settings

**`transactions`**: Payment records and status tracking
- `id`: UUID primary key
- `payment_link_id`: Foreign key to payment_links
- `nowpayments_id`: External payment processor ID
- `amount`, `currency`: Transaction amounts
- `status`: Payment status enum
- `blockchain_hash`: Transaction hash on blockchain
- `confirmed_at`: Confirmation timestamp

**`subscriptions`**: Recurring payment configurations
- `id`: UUID primary key
- `payment_link_id`: Foreign key to payment_links
- `customer_email`: Subscriber contact information
- `billing_cycle`: Frequency (daily, weekly, monthly, yearly)
- `next_billing_date`: Next scheduled payment
- `status`: Active, paused, cancelled
- `amount_override`: Custom billing amount

**`subscription_invoices`**: Generated subscription invoices
- `id`: UUID primary key
- `subscription_id`: Foreign key to subscriptions
- `invoice_number`: Unique invoice identifier
- `amount`, `currency`: Invoice totals
- `due_date`: Payment due date
- `status`: Draft, sent, paid, overdue
- `payment_link_id`: Generated payment link for invoice

**Relationships and Indexes**:
- Foreign key constraints maintain referential integrity
- Indexes on frequently queried fields (user_id, status, created_at)
- Row-level security policies for data access control
- Composite indexes for complex queries (merchant_id + status)

#### 5. Authentication & Authorization

**User Authentication**:
- Supabase Auth handles user registration and login
- Email/password authentication with email verification
- Session management with automatic token refresh
- Support for social login providers (configurable)

**Authorization Patterns**:
- Merchant access controlled via `user_id` relationships in database
- Row-level security (RLS) policies enforce data isolation
- API routes verify authentication via Supabase client
- Role-based access control for different user types

**Security Measures**:
- Public payment pages don't require authentication for customer convenience
- Internal API endpoints protected with INTERNAL_API_KEY
- CSRF protection on state-changing operations
- Rate limiting on payment creation endpoints

**Session Management**:
- Automatic session refresh for logged-in users
- Secure session storage using HTTP-only cookies
- Session expiration handling with graceful logout
- Multi-device session support with revocation capabilities

### Important Implementation Details

#### 1. Wallet Validation
- **Endpoint**: `/api/wallets/validate`
- **Purpose**: Validate cryptocurrency wallet addresses before storage
- **Implementation**: Uses blockchain-specific validation libraries
- **Supported Networks**: Bitcoin, Ethereum, Litecoin, and ERC-20 tokens
- **Usage**: Always call before saving wallet addresses to prevent invalid configurations

#### 2. Currency Support and Stablecoin Associations
- **Dynamic Currency Lists**: Fetched from NOWPayments API for real-time availability
- **Automatic Stablecoin Associations**: Dashboard components automatically associate USDC, USDT, DAI with configured wallets
- **Currency Name Mappings**: Defined in `CURRENCY_NAMES` constants for user-friendly display
- **Exchange Rates**: Real-time rate fetching for accurate payment amount calculations

#### 3. Fee Structure and Pricing
- **Gateway Fees**: 0.5-1% fees handled directly by NOWPayments, transparent to merchants
- **No Platform Fees**: Cryptrac doesn't charge additional fees on top of gateway fees
- **Transparent Pricing**: All fees disclosed upfront during payment creation
- **Merchant Benefits**: Direct payments to merchant wallets with minimal processing overhead

#### 4. PWA (Progressive Web App) Support
- **Configuration**: Implemented via `next-pwa` plugin in `next.config.ts`
- **Offline Capability**: Service worker caching for offline payment page access
- **Mobile Optimization**: App-like experience on mobile devices
- **Installation**: Users can install Cryptrac as a standalone app
- **Development Mode**: PWA features disabled during development for easier debugging

#### 5. WebAssembly Integration
- **Purpose**: Enabled for cryptocurrency libraries requiring WebAssembly
- **Use Cases**: Bitcoin and Ethereum address validation, cryptographic operations
- **Performance**: WebAssembly provides near-native performance for crypto operations
- **Browser Support**: Fallback implementations for unsupported browsers

#### 6. Real-time Features
- **Supabase Subscriptions**: Real-time payment status updates on payment pages
- **Live Currency Rates**: Dynamic rate updates for accurate pricing
- **Payment Confirmations**: Instant notifications when payments are confirmed
- **Dashboard Updates**: Real-time merchant dashboard updates for new payments

### API Authentication

**Internal Service Authentication**:
- Internal API calls between services use `INTERNAL_API_KEY` header for authentication
- Primary use case: Subscription system creating payment links automatically
- Key should be a cryptographically secure random string (minimum 32 characters)
- Different from user authentication - used for server-to-server communication

**User Authentication Flow**:
- Client-side: Supabase Auth client manages user sessions
- Server-side: API routes validate sessions using Supabase server client
- Protected routes redirect unauthenticated users to login
- Session tokens automatically refreshed for seamless user experience

**Webhook Authentication**:
- NOWPayments webhooks validated using IPN secret signature verification
- Prevents unauthorized webhook calls and ensures data integrity
- Signature validation logic in webhook handlers
- Failed authentication results in webhook rejection

### Deployment Notes

#### Build Configuration
- **ESLint**: Errors ignored during builds (configured in `next.config.ts`)
  - Allows builds to complete even with linting issues
  - Recommended to fix linting issues before deployment
  - Linting still available via `npm run lint` command

#### PWA Configuration
- **Development**: PWA features disabled in development mode for easier debugging
- **Production**: Full PWA capabilities enabled with service worker caching
- **Caching Strategy**: Optimized for payment page availability and performance

#### Routing and Redirects
- **Legacy Routes**: Redirects configured for legacy wallet settings routes
- **Clean URLs**: SEO-friendly URLs for payment pages and merchant dashboard
- **Error Handling**: Custom 404 and error pages for better user experience

#### Performance Optimizations
- **Image Optimization**: Configured for QR code generation and merchant logos
- **Bundle Splitting**: Automatic code splitting for optimal loading performance
- **Static Generation**: Pre-rendering of public pages for faster initial loads
- **CDN Ready**: Optimized for deployment with CDN services

#### Environment-Specific Considerations
- **Development**: Hot reloading, detailed error messages, debugging tools enabled
- **Staging**: Production-like configuration with staging API endpoints
- **Production**: Optimized builds, error tracking, performance monitoring

## Testing

### Current State
No test framework currently configured. The application would benefit from comprehensive testing coverage.

### Recommended Testing Strategy

#### Unit Testing
- **Framework**: Jest or Vitest for unit testing
- **Coverage**: Utility functions, API route handlers, payment logic
- **Mock Strategy**: Mock external APIs (NOWPayments, Supabase, SendGrid)
- **Focus Areas**: Payment calculations, wallet validation, currency conversions

#### Integration Testing
- **API Testing**: Test API endpoints with real database interactions
- **Payment Flow**: End-to-end payment creation and processing
- **Webhook Testing**: Simulate NOWPayments webhook calls
- **Database Testing**: Test Supabase queries and mutations

#### Frontend Testing
- **Framework**: React Testing Library with Jest
- **Component Testing**: UI component behavior and rendering
- **User Interactions**: Form submissions, payment flows, navigation
- **Responsive Testing**: Mobile and desktop layout validation

#### E2E Testing
- **Framework**: Playwright or Cypress
- **Critical Paths**: Complete payment flows, merchant onboarding
- **Cross-Browser**: Testing across different browsers and devices
- **Performance**: Load testing for payment processing

### Testing Setup Recommendations
```bash
# Install testing dependencies
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom

# Create test configuration
jest.config.js
setupTests.ts

# Add test scripts to package.json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

## Common Development Tasks

### Adding a New Cryptocurrency

#### Step-by-Step Process
1. **Update Wallet Validation** (`/api/wallets/validate`):
   ```typescript
   // Add validation logic for new cryptocurrency
   case 'NEW_COIN':
     return validateNewCoinAddress(address);
   ```

2. **Add Currency Mapping** (dashboard components):
   ```typescript
   const CURRENCY_NAMES = {
     ...existing_currencies,
     'new_coin': 'New Coin (NEW)',
   };
   ```

3. **Configure Stablecoin Associations** (if applicable):
   - Update automatic stablecoin pairing logic
   - Ensure proper currency grouping in UI

4. **Verify NOWPayments Support**:
   - Check NOWPayments API for currency availability
   - Test payment creation with new currency
   - Validate webhook handling for new coin type

5. **Update Type Definitions**:
   ```typescript
   type SupportedCurrency = 'btc' | 'eth' | 'new_coin' | ...;
   ```

#### Testing New Currency Integration
- Test wallet address validation
- Verify payment link creation
- Test payment processing flow
- Validate webhook processing

### Creating New API Endpoints

#### Route Handler Structure
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Database operations
    const { data, error: dbError } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. Return consistent response
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Best Practices
- **Authentication**: Always verify user authentication for protected endpoints
- **Error Handling**: Consistent error response format across all endpoints
- **Validation**: Validate input parameters using type-safe schemas
- **Database Access**: Use appropriate Supabase client (client/server/admin)
- **Response Format**: Standardize response structure for frontend consumption

#### Common Patterns
- **Pagination**: Implement offset/limit for large datasets
- **Filtering**: Support query parameters for data filtering
- **Rate Limiting**: Implement rate limiting for resource-intensive endpoints
- **Caching**: Add appropriate caching headers for cacheable responses

### Modifying Payment Flow

#### Key Components to Update

1. **Payment Link Creation** (`/api/payments/create`):
   - Input validation and sanitization
   - Currency support and exchange rate fetching
   - Database record creation
   - Response formatting with payment link URL

2. **Payment Page UI** (`/app/pay/[id]/page.tsx`):
   - Real-time payment status updates
   - QR code generation for mobile payments
   - Currency selection and amount display
   - Progress indicators and user feedback

3. **Status Updates** (`/api/payments/[id]/status`):
   - NOWPayments API integration for status checking
   - Database synchronization
   - Real-time updates via Supabase subscriptions
   - Error handling and retry logic

4. **Webhook Processing** (`/api/webhooks/nowpayments`):
   - Signature verification for security
   - Payment status interpretation
   - Database updates and notifications
   - Email trigger for payment confirmations

#### Flow Modification Examples

**Adding New Payment Status**:
```typescript
// Update type definitions
type PaymentStatus = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'new_status';

// Update database schema
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS new_status_field;

// Update webhook handler
switch (payment.payment_status) {
  case 'new_status':
    // Handle new status logic
    break;
}
```

**Implementing Payment Retries**:
```typescript
// Add retry logic to payment processing
const MAX_RETRIES = 3;
let retryCount = 0;

while (retryCount < MAX_RETRIES) {
  try {
    const result = await processPayment(paymentData);
    break; // Success, exit retry loop
  } catch (error) {
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      throw error; // Final failure
    }
    await delay(1000 * retryCount); // Exponential backoff
  }
}
```

#### Testing Payment Flow Changes
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete payment flows
- **Webhook Testing**: Use NOWPayments sandbox for webhook validation
- **User Testing**: Manual testing of customer payment experience

### Database Management

#### Migration Best Practices
```sql
-- Example migration for new feature
-- migrations/003_add_feature.sql

-- Add new table
CREATE TABLE feature_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own features"
ON feature_table FOR SELECT
USING (merchant_id IN (
  SELECT id FROM merchants WHERE user_id = auth.uid()
));

-- Add indexes
CREATE INDEX idx_feature_table_merchant_id ON feature_table(merchant_id);
CREATE INDEX idx_feature_table_created_at ON feature_table(created_at);
```

#### Query Optimization Tips
- Use proper indexes for frequently queried columns
- Implement pagination for large datasets
- Use Supabase's real-time features for live updates
- Optimize joins and use appropriate query patterns

### Error Handling and Monitoring

#### Error Handling Patterns
```typescript
// Consistent error handling
try {
  const result = await riskyOperation();
  return { data: result, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  
  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
  
  return { 
    data: null, 
    error: 'Operation failed. Please try again.' 
  };
}
```

#### Monitoring Recommendations
- **Error Tracking**: Integrate Sentry or similar service
- **Performance Monitoring**: Track API response times
- **Payment Monitoring**: Alert on payment failures
- **Database Monitoring**: Track query performance and errors

## Security Considerations

### Data Protection
- **Sensitive Data**: Never log or expose API keys, wallet private keys, or user sensitive information
- **Input Validation**: Sanitize all user inputs to prevent injection attacks
- **Rate Limiting**: Implement rate limiting on payment creation and API endpoints
- **HTTPS**: Always use HTTPS in production for encrypted communication

### Cryptocurrency Security
- **Non-Custodial**: Application never handles private keys or controls user funds
- **Address Validation**: Validate wallet addresses before storage to prevent loss of funds
- **Payment Verification**: Always verify payments through blockchain or payment processor
- **Webhook Security**: Validate webhook signatures to prevent fraudulent notifications

### Authentication Security
- **Session Management**: Secure session handling with proper expiration
- **Password Policies**: Enforce strong password requirements
- **Two-Factor Authentication**: Consider implementing 2FA for merchant accounts
- **Account Lockout**: Implement account lockout after failed login attempts

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Utilize Next.js automatic code splitting
- **Image Optimization**: Use Next.js Image component for optimized loading
- **Lazy Loading**: Implement lazy loading for non-critical components
- **Caching**: Implement proper caching strategies for API responses

### Backend Performance
- **Database Optimization**: Use proper indexes and query optimization
- **API Response Caching**: Cache frequently requested data
- **Connection Pooling**: Optimize database connection usage
- **Background Processing**: Use edge functions for time-intensive operations

### Monitoring and Metrics
- **Performance Metrics**: Track page load times and API response times
- **User Analytics**: Monitor user behavior and conversion rates
- **Error Rates**: Track and alert on error rate increases
- **Payment Success Rates**: Monitor payment completion rates