# Belly Bee — Auth UX, Legal Pages & Motion Design Spec

**Date:** 2026-04-16
**Scope:** Guest auth redirect · Login page redesign · Terms & Conditions · Privacy Policy · motion animations
**Status:** Approved for implementation

---

## 1. Guest Auth & Cart Persistence Flow

### Behaviour

Guests may browse the full menu, open item detail pages, and **add items to the cart without any interruption**. The cart badge shows item count for guest users identically to logged-in users.

The login wall appears **only at checkout entry** — specifically when the user taps "Proceed to Checkout" in `CartComponent`. No earlier.

### Redirect Logic

**In `CartComponent`** — the "Proceed to Checkout" button calls `checkoutGuard()`:

```
if (authService.isLoggedIn()) {
  router.navigate(['/checkout/address'])
} else {
  router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout/address' } })
}
```

**In `app.routes.ts`** — add `canActivate: [authGuard]` to the `/checkout` parent route so direct URL access (`/checkout/address`, `/checkout/payment`) is also blocked for guests.

**In `VerifyComponent`** (OTP success) — after login, navigate to `returnUrl` query param (already implemented). Cart is intact because:
- `CartService` persists to `localStorage` key `bb_cart`
- Login does **not** clear localStorage
- On return to `/checkout/address` the cart is unchanged

### Cart Persistence — Backend Hook (future)

When connecting the real NestJS backend:
1. On `AuthService` login success, read `localStorage.getItem('bb_cart')`
2. If non-empty, call `POST /v1/cart/merge` with the guest cart payload
3. Backend merges guest items with any existing server-side cart (last-write-wins per item, or union — backend decision)
4. `CartService.replaceFromServer(mergedItems)` updates localStorage with the merged result

This hook is a single `tap()` in the `AuthService.verifyOtp()` observable chain — no CartService restructuring needed.

---

## 2. Login Page Redesign

### Visual Design — Approved (Design B v2)

**Full-bleed dark background:**
- Base: `#0C0501` (near-black warm)
- Radial gradients: amber-orange at top-left, deep brown at bottom-right
- Honeycomb SVG tile pattern at 5.5% opacity
- Two ambient glow orbs that slowly drift (CSS `@keyframes`)
- Floating food emojis (🍛 🍯 🐝 🌶️ ✦) at 10% opacity, gentle vertical float animation

**Glass card:**
- `backdrop-filter: blur(32px) saturate(180%)`
- `background: rgba(255,255,255, 0.065)`
- `border: 1px solid rgba(255,255,255, 0.12)`
- `border-radius: 28px`
- Top shimmer line: `linear-gradient(90deg, transparent, rgba(245,166,35,0.55), transparent)`

**Header band (top of card):**
- Warm honey-tinted background strip with 3px honey-gradient bar along very top
- **Hexagonal logo**: `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)` containing `assets/bellyBeeLogo.webp`; SVG bee fallback on image error
- Brand name: "Belly **Bee**" — `Playfair Display 800`, white / honey-amber
- Sub-tagline: "Cloud Kitchen ✦ Fresh & Fast" in `Caveat` font, amber-tinted
- Location: "Chhatarpur · New Delhi 110074" in small uppercase, muted

**Form body:**
- Heading: "Welcome back! 👋" (`Playfair Display 800`)
- Sub: "Enter your mobile — we'll send a quick OTP."
- Perks strip: 🚀 30-min Delivery · 🌿 Fresh Daily · 💳 Easy Pay (honey-tinted pills)
- Phone input: 🇮🇳 +91 prefix with honey background, dark input field, honey border-glow on focus
- **Single checkbox** (unchecked by default):
  > "I agree to Belly Bee's **Terms & Conditions** and **Privacy Policy** — including our data & order policies."
  - Custom checkbox: honey gradient + ✓ when checked, honey box-shadow
  - "Get OTP" button `disabled` until checkbox is ticked
- CTA button: `linear-gradient(135deg, #F5A623, #D4881A, #C07010)`, shimmer sweep animation, arrow slides right on hover
- Divider + "← Browse Menu as Guest" ghost link

**Trust footer:** 🔒 Secure OTP · ⭐ 4.8 Rated · 🏠 Chhatarpur

### motion Animations (login page)

Using `animate()` from `motion/mini` (vanilla JS API, 2.5kB):

| Element | Animation | Timing |
|---------|-----------|--------|
| `.glass-card` | `opacity 0→1, translateY 36px→0, scale 0.95→1` | `spring(stiffness:280, damping:22)` |
| `.header-band` | `opacity 0→1, translateY -10px→0` | `delay: 0.15s, duration: 0.4s` |
| `.perk` items | staggered `opacity 0→1, translateY 8px→0` | `stagger(0.06s)` |
| Phone input | `opacity 0→1, translateX -12px→0` | `delay: 0.3s` |
| Checkbox block | `opacity 0→1` | `delay: 0.4s` |
| CTA button | `scale 1→1.03→1` pulse when checkbox checked | `spring(stiffness:400, damping:15)` |

All animations run in `ngAfterViewInit` via direct DOM `querySelectorAll`.

### File Changes

- `src/app/pages/auth/login/login.component.ts` — add `termsAccepted` signal, `canSubmit` computed, T&C links
- `src/app/pages/auth/login/login.component.html` — full redesign per spec
- `src/app/pages/auth/login/login.component.css` — full redesign per spec

---

## 3. Terms & Conditions Page

**Route:** `/terms` (lazy-loaded, no auth guard)
**File:** `src/app/pages/legal/terms/terms.component.{ts,html,css}`

### Layout

- **Sticky header**: Belly Bee hex logo + "Terms & Conditions" + "Last updated: April 2026"
- **Two-column on desktop (≥768px)**: sticky left ToC sidebar (200px) + scrollable content right
- **Single column on mobile**: ToC collapses to a horizontal scroll strip at top
- Warm `#FFFDF7` background, honey-amber section headings, card-style content blocks
- Back to Home arrow link top-left

### Sections & Content

1. **Acceptance of Terms** — By placing an order, the user accepts these terms. Must be 18+.
2. **Services & Ordering** — Belly Bee operates a cloud kitchen from Chhatarpur, New Delhi. Orders placed through the app/website are binding. We reserve the right to refuse or cancel orders at our discretion.
3. **Delivery Area & Availability** — Currently serving Chhatarpur, Mehrauli, Saket, and nearby areas of New Delhi. Delivery availability subject to location, time, and capacity.
4. **Pricing & Payment** — All prices are in INR and inclusive of applicable taxes. Payment via UPI, cards, net banking, and Cash on Delivery. Prices may change without notice.
5. **Cancellation & Refunds** — Orders can be cancelled within 2 minutes of placement. After confirmation, cancellations are at our discretion. Refunds processed within 5–7 business days to original payment method. No refund on COD orders once delivered.
6. **Food & Allergens** — We take care to prepare food safely but cannot guarantee allergen-free preparation. Customers with severe allergies should contact us before ordering.
7. **User Accounts** — Users are responsible for account security. Accounts may be suspended for abuse, fraudulent activity, or policy violations.
8. **Intellectual Property** — All content, logos, and brand elements are property of Belly Bee. Unauthorised use is prohibited.
9. **Limitation of Liability** — Belly Bee is not liable for indirect or consequential damages. Maximum liability is limited to the value of the disputed order.
10. **Governing Law** — These terms are governed by the laws of India. Disputes subject to the jurisdiction of courts in New Delhi.
11. **Contact Us** — Email: support@bellybee.in · Phone: available on website · Address: Chhatarpur, New Delhi 110074

### motion Animations

Section headings and content blocks animate in using `inView()` from `motion/mini` on scroll: `opacity 0→1, translateY 16px→0` with `duration: 0.4s`.

---

## 4. Privacy Policy Page

**Route:** `/privacy` (lazy-loaded, no auth guard)
**File:** `src/app/pages/legal/privacy/privacy.component.{ts,html,css}`

### Layout

Identical layout system to the T&C page (sticky header, two-column ToC, same design tokens).

### Sections & Content

1. **Introduction** — Belly Bee ("we", "us") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.
2. **Data We Collect**
   - *Account data*: Mobile number, name, email (optional)
   - *Order data*: Items ordered, delivery address, payment method (not card details)
   - *Location data*: Delivery address provided by user; approximate location with permission for "detect my location"
   - *Device data*: IP address, browser type, device identifiers (for fraud prevention)
   - *Usage data*: Pages visited, items browsed, time spent (for improving recommendations)
3. **How We Use Your Data** — Process and deliver orders; send OTP and order status notifications; improve our menu and service; prevent fraud; comply with legal obligations.
4. **Sharing with Third Parties** — We share data only with: (a) delivery partners, to fulfil your order; (b) payment gateway (Razorpay), for payment processing — we do not store card details; (c) analytics providers, in aggregated anonymised form. We do not sell your data.
5. **Cookies & Local Storage** — We use `localStorage` to store your cart and preferences. We use minimal analytics cookies. You can clear these via browser settings.
6. **Data Retention** — Order and account data retained for 3 years for legal compliance. You can request deletion of non-mandatory data.
7. **Your Rights** — You may access, correct, or request deletion of your personal data by contacting us. We respond within 30 days.
8. **Data Security** — All data in transit is encrypted via HTTPS. OTP-based authentication means no passwords are stored.
9. **Children's Privacy** — Our service is not directed to children under 13. We do not knowingly collect data from minors.
10. **Changes to This Policy** — We may update this policy. Continued use of the service constitutes acceptance of updates.
11. **Contact Us** — Email: privacy@bellybee.in · Address: Chhatarpur, New Delhi 110074

### motion Animations

Same scroll-triggered `inView()` pattern as T&C page.

---

## 5. motion Package Integration

### Installation

```bash
npm install motion --legacy-peer-deps
```

### Angular Usage Pattern

`motion/mini` exports a tree-shakeable vanilla JS API — no framework wrapper needed.

```typescript
import { animate, stagger, inView, spring } from 'motion/mini';

// In ngAfterViewInit:
animate(
  this.el.nativeElement.querySelector('.glass-card'),
  { opacity: [0, 1], y: [36, 0], scale: [0.95, 1] },
  { easing: spring({ stiffness: 280, damping: 22 }) }
);
```

`ElementRef` is injected to scope all queries. No global imports needed.

### Usage Locations

| Component | API Used |
|-----------|----------|
| `LoginComponent` | `animate()`, `stagger()` on card entrance; `animate()` on checkbox toggle |
| `TermsComponent` | `inView()` on each section block |
| `PrivacyComponent` | `inView()` on each section block |

---

## 6. Route & Navigation Updates

### `app.routes.ts` additions

```typescript
// Checkout — auth guarded (add canActivate)
{ path: 'checkout', canActivate: [authGuard], children: [...] }

// Legal pages — new, no auth guard
{ path: 'terms',   loadComponent: () => import('./pages/legal/terms/terms.component').then(m => m.TermsComponent),   title: 'Terms & Conditions — Belly Bee' },
{ path: 'privacy', loadComponent: () => import('./pages/legal/privacy/privacy.component').then(m => m.PrivacyComponent), title: 'Privacy Policy — Belly Bee' },
```

### Login page links

`/auth/login` T&C and Privacy Policy links updated to point to `/terms` and `/privacy` respectively (currently both point to `/main`).

### Cart page

"Proceed to Checkout" button changes from `[routerLink]="/checkout"` to `(click)="proceedToCheckout()"` which checks login state before navigating.

### Footer

Add "Terms & Conditions" and "Privacy Policy" links to `AppComponent` footer.

---

## 7. Files Created / Modified

| Action | File |
|--------|------|
| Install | `motion` npm package |
| Modify | `src/app/pages/auth/login/login.component.{ts,html,css}` |
| Modify | `src/app/pages/cart/cart.component.{ts,html}` |
| Modify | `src/app/app.routes.ts` |
| Modify | `src/app/app.component.html` (footer links) |
| Create | `src/app/pages/legal/terms/terms.component.{ts,html,css}` |
| Create | `src/app/pages/legal/privacy/privacy.component.{ts,html,css}` |
