# Usage-Based Pricing with Polar

## Overview

Prepaid credit system for image generation. Users purchase credit packs via Polar, credits are deducted per generation (1:1), balance visible at all times. No subscriptions—pure usage-based model.

## Problem Statement

**Who:** Individual users wanting to generate AI images
**Problem:** Need a pay-as-you-go model for image generation without subscription commitment
**Impact:** Users can access AI image generation at their own pace, paying only for what they use

## User Stories

### Primary Flow

- [ ] As a user, I can purchase a credit pack so that I can generate images
- [ ] As a user, I can see my current credit balance at all times so that I know how many generations I have left
- [ ] As a user, I can use 1 credit to generate 1 image so that I get value from my purchase

### Secondary Flows (Nice-to-have, post-MVP)

- [ ] As a user, I can view my purchase history so that I can track my spending
- [ ] As a user, I can view my usage history so that I can see how I spent my credits

## Business Rules

### Permissions

- Rule 1: User must be authenticated → can view balance
- Rule 2: User must be authenticated → can purchase credits
- Rule 3: User must have credits > 0 → can generate images
- Rule 4: User has 0 credits → blocked from generation, shown purchase prompt

### Credit System

- 1 credit = 1 image generation
- Credits stack: buying additional packs adds to existing balance
- Credits never expire
- No rate limits on generation (as fast as credits allow)

### Pricing

- Single pack: 10 credits for $5 ($0.50/image)

### Refunds

- Purchase refunds: None (all sales final)
- Failed generation: Auto-refund credits to user balance

### Validation

- Credit balance: must be ≥ 1 to initiate generation
- Purchase: standard Polar payment validation

## Data Model

### Entities

**UserCredits**
| Property | Type | Description |
|----------|------|-------------|
| userId | string | Reference to user |
| balance | integer | Current credit count (≥ 0) |
| updatedAt | datetime | Last balance change |

**CreditTransaction**
| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier |
| userId | string | Reference to user |
| type | enum | "purchase" \| "usage" \| "refund" |
| amount | integer | Credits added (+) or deducted (-) |
| referenceId | string | Polar order ID or generation ID |
| createdAt | datetime | Transaction timestamp |

### Relationships

- User has one UserCredits
- User has many CreditTransactions
- CreditTransaction references either a Polar purchase or an image generation

### State Transitions

```
[No Credits] → [Purchase via Polar] → [Has Credits]
[Has Credits] → [Generate Image] → [Has Credits] (balance - 1)
[Has Credits] → [Generate Image] → [No Credits] (if balance was 1)
[No Credits] → [Attempt Generation] → [Blocked, Show Purchase Prompt]
[Generation Failed] → [Auto Refund] → [Credits Restored]
```

## UI/UX Specification

### Component: Credit Balance (Header)

**Location:** Main navigation/header, always visible when authenticated

**Layout:**

- Credit icon + current balance number (e.g., "🪙 7")
- Clickable → navigates to credits purchase page

**States:**
| State | Display |
|-------|---------|
| Has credits | Icon + number (e.g., "🪙 7") |
| Zero credits | Icon + "0" with visual indicator (red/warning) |
| Loading | Skeleton/spinner |

### Screen: Credits Purchase Page

**Entry point:** Click balance in header, or "Buy Credits" CTA when blocked

**URL:** `/dashboard/credits` or `/credits`

**Layout:**

- Current balance display (prominent)
- Credit pack card:
  - "10 Credits - $5"
  - "$0.50 per image"
  - "Buy" button → Polar checkout
- Brief explanation of how credits work

**States:**
| State | Display |
|-------|---------|
| Normal | Pack card with buy button |
| Loading | Button shows loading state after click |
| Success | Redirect to success page or show confirmation, balance updated |
| Error | Toast/inline error message |

**Interactions:**
| Element | Action | Result |
|---------|--------|--------|
| Buy button | Click | Initiates Polar checkout flow |
| Balance in header | Click | Already on this page (no-op or scroll to top) |

### Screen: Purchase Success

**Entry point:** Redirect from Polar after successful payment

**Layout:**

- Success message: "Credits added!"
- New balance display
- CTA to start generating

### Component: Generation Blocked State

**Entry point:** User tries to generate with 0 credits

**Layout:**

- Message: "You're out of credits"
- "Buy Credits" CTA button
- Current balance (0)

### Navigation Flow

```
[Any Page] → [Click header balance] → [Credits Page]
[Credits Page] → [Buy] → [Polar Checkout] → [Success Page]
[Success Page] → [CTA] → [Generation Page]
[Generation Page] → [0 credits] → [Blocked State] → [Buy CTA] → [Credits Page]
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Polar checkout fails | User returns to credits page, balance unchanged, error toast |
| Polar webhook delayed | Poll or optimistic update, eventually consistent |
| Generation API fails | Auto-refund credit to balance, show error to user |
| Network failure during purchase | Polar handles, user can retry |
| Duplicate webhook | Idempotent handling, don't double-credit |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Balance = 0 | Block generation, show purchase prompt |
| Balance = 1, generation succeeds | Balance becomes 0 |
| Balance = 1, generation fails | Refund, balance stays 1 |
| Multiple rapid purchases | Credits stack (additive) |
| User deletes account | Credits are lost (no refund policy) |

## Acceptance Criteria

### Purchasing Credits

- [ ] **Given** authenticated user on credits page, **when** they click buy, **then** Polar checkout opens
- [ ] **Given** successful Polar payment, **when** webhook received, **then** 10 credits added to user balance
- [ ] **Given** user had 5 credits and buys 10 more, **when** purchase completes, **then** balance shows 15
- [ ] **Given** Polar checkout cancelled, **when** user returns, **then** balance unchanged

### Viewing Balance

- [ ] **Given** authenticated user, **when** on any page, **then** credit balance visible in header
- [ ] **Given** balance changes (purchase or usage), **when** page refreshes or realtime update, **then** header shows new balance
- [ ] **Given** balance is 0, **when** user views header, **then** balance shows warning styling

### Using Credits

- [ ] **Given** user has ≥1 credit, **when** they generate image, **then** 1 credit deducted
- [ ] **Given** user has 0 credits, **when** they try to generate, **then** blocked with purchase prompt
- [ ] **Given** generation fails (API error), **when** credit was deducted, **then** credit auto-refunded

## MVP Scope

**Must-have for launch:**

- Credit balance in header
- Credits purchase page with single pack
- Polar integration for payment
- Credit deduction on generation
- Blocked state when 0 credits
- Auto-refund on failed generation

**Post-MVP (nice-to-have):**

- Purchase history page
- Usage history/log page
- Multiple pack tiers with volume discounts
- Low balance notifications

## Out of Scope

- Subscription-based billing
- Organization/team billing
- Credit expiration
- Credit gifting or transfers
- Refunds for purchases
- Multiple credit pack options (MVP is single pack)
- Usage history UI (MVP just tracks internally)

## Open Questions

- [ ] Legal: Need to clarify terms of service for no-refund policy
- [ ] Legal: GDPR considerations for credit/transaction data retention
- [ ] Design: Exact placement of credit balance in header (needs design review)
- [ ] Polar: Confirm webhook setup and product configuration steps
