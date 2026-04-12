# Belly Bee Frontend Complete Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Belly Bee Angular 18 app into a complete, production-ready food ordering frontend with mock-first service architecture, honey-amber design system, and full feature coverage per the design spec.

**Architecture:** Standalone Angular 18 components, lazy-loaded routes, mock-first services behind `environment.useMock` flag, custom CSS design system (no Bootstrap, no Angular Material), PWA-enabled.

**Tech Stack:** Angular 18.2, RxJS 7, Leaflet, Razorpay SDK (dynamic load), Firebase Hosting, Google Fonts (Playfair Display / DM Sans / Caveat), CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-04-12-belly-bee-frontend-design.md`

---

## Task 1: Fix Build Config + Environments

**Files:**
- Modify: `angular.json`
- Modify: `package.json`
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`

- [ ] Fix `angular.json` — change `outputPath`, remove Bootstrap/Material, keep Leaflet

- [ ] Fix `package.json` name field

- [ ] Rewrite `environment.ts`

- [ ] Rewrite `environment.prod.ts`

- [ ] Commit: `fix: correct build output path, remove bootstrap/material, update environments`

---

## Task 2: Global Design System — styles.css + index.html

**Files:**
- Modify: `src/styles.css`
- Modify: `src/index.html`
- Create: `src/public/robots.txt`
- Create: `src/public/sitemap.xml`

- [ ] Replace styles.css with full design token system + base styles

- [ ] Update index.html: Google Fonts, JSON-LD, OG meta, canonical

- [ ] Create robots.txt and sitemap.xml in `src/public/`

- [ ] Commit: `style: honey-amber design system, Google Fonts, SEO foundation`

---

## Task 3: TypeScript Models

**Files:**
- Create: `src/app/models/category.model.ts`
- Create: `src/app/models/menu-item.model.ts`
- Create: `src/app/models/cart.model.ts`
- Create: `src/app/models/order.model.ts`
- Create: `src/app/models/address.model.ts`
- Create: `src/app/models/user.model.ts`
- Create: `src/app/models/coupon.model.ts`
- Create: `src/app/models/index.ts`

- [ ] Create all model files

- [ ] Create barrel `src/app/models/index.ts` exporting all

- [ ] Commit: `feat: add TypeScript models for all domain entities`

---

## Task 4: Core Infrastructure

**Files:**
- Modify: `src/app/core/auth-token.service.ts`
- Create: `src/app/core/guards/auth.guard.ts`
- Modify: `src/app/core/auth.interceptor.ts`
- Create: `src/app/core/interceptors/error.interceptor.ts`
- Modify: `src/app/core/api.service.ts`

- [ ] Update `auth-token.service.ts`: rename key to `bb_token`

- [ ] Create functional `authGuard`

- [ ] Update `auth.interceptor.ts`: read from `bb_token`

- [ ] Create `error.interceptor.ts`: 401 → logout + redirect; 500 → toast

- [ ] Update `api.service.ts`: use `environment.apiUrl`, typed get/post/put/delete wrappers

- [ ] Commit: `feat: core guards, interceptors, typed API service`

---

## Task 5: Mock Data Service

**Files:**
- Create: `src/app/core/mock/mock-data.service.ts`

- [ ] Create mock with 10 categories and 35 items using real Belly Bee menu names + existing assets

- [ ] Include mock orders, addresses, user, coupons

- [ ] Commit: `feat: mock data service with 35 menu items from Belly Bee menu`

---

## Task 6: Services Layer

**Files:**
- Create: `src/app/services/auth.service.ts`
- Create: `src/app/services/menu.service.ts`
- Create: `src/app/services/cart.service.ts`
- Create: `src/app/services/order.service.ts`
- Create: `src/app/services/payment.service.ts`
- Create: `src/app/services/location.service.ts`
- Create: `src/app/services/coupon.service.ts`
- Create: `src/app/services/theme.service.ts`
- Create: `src/app/services/toast.service.ts`
- Create: `src/app/services/analytics.service.ts`

- [ ] Create each service with mock/real switching pattern

- [ ] Commit: `feat: all application services with mock-first architecture`

---

## Task 7: App Shell — Routes, Config, App Component

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.css`

- [ ] Replace routes with lazy `loadComponent()` for all 16 routes

- [ ] Update app.config: add error interceptor, remove old providers

- [ ] App component: header + `<router-outlet>` + footer + toast

- [ ] Commit: `feat: lazy routes, updated app shell`

---

## Task 8: Shared Components

**Files:**
- Create: `src/app/shared/header/header.component.{ts,html,css}`
- Create: `src/app/shared/footer/footer.component.{ts,html,css}`
- Create: `src/app/shared/veg-badge/veg-badge.component.{ts,html,css}`
- Create: `src/app/shared/rating-stars/rating-stars.component.{ts,html,css}`
- Create: `src/app/shared/skeleton-loader/skeleton-loader.component.{ts,html,css}`
- Create: `src/app/shared/toast/toast.component.{ts,html,css}`
- Create: `src/app/shared/item-card/item-card.component.{ts,html,css}`
- Create: `src/app/shared/customization-sheet/customization-sheet.component.{ts,html,css}`

- [ ] Build Header: logo, nav, cart badge, profile icon, mobile hamburger, glassmorphism on scroll

- [ ] Build Footer: brand, links, social, copyright

- [ ] Build VegBadge: green/red FSSAI dot

- [ ] Build RatingStars: filled/half/empty from numeric input

- [ ] Build SkeletonLoader: shimmer card/list/text/hero variants

- [ ] Build Toast: driven by ToastService, auto-dismiss, stacks

- [ ] Build ItemCard: image (NgOptimizedImage), badges, price, add button → emits openCustomization

- [ ] Build CustomizationSheet: bottom sheet, spicy/size/serve selectors, qty stepper, add CTA

- [ ] Commit: `feat: all shared components — header, footer, item-card, customization-sheet, etc.`

---

## Task 9: Home Page

**Files:**
- Create: `src/app/pages/home/home.component.{ts,html,css}`

- [ ] Build HomeComponent: hero banner, category chips, popular this week, new arrivals, offers strip

- [ ] Set Title + Meta in ngOnInit

- [ ] Commit: `feat: home page with hero, categories, popular, new arrivals`

---

## Task 10: Menu Page

**Files:**
- Create: `src/app/pages/menu/menu.component.{ts,html,css}`

- [ ] Category sidebar (desktop) + scroll tabs (mobile)

- [ ] Search with 300ms debounce, veg/spicy/discount/top-rated filters, sort

- [ ] Grid of ItemCardComponents + skeleton loaders

- [ ] Reads `:categoryId` from route params

- [ ] Commit: `feat: menu page with categories, search, filters`

---

## Task 11: Item Detail Page

**Files:**
- Create: `src/app/pages/item-detail/item-detail.component.{ts,html,css}`

- [ ] Full image, details, inline customization, related items

- [ ] Commit: `feat: item detail page`

---

## Task 12: Cart Page

**Files:**
- Create: `src/app/pages/cart/cart.component.{ts,html,css}`

- [ ] Item list with qty controls, coupon input, price breakdown, checkout CTA, empty state

- [ ] Commit: `feat: cart page`

---

## Task 13: Checkout — Address

**Files:**
- Create: `src/app/pages/checkout/address/address.component.{ts,html,css}`

- [ ] Saved addresses, add new (Leaflet map), current location, delivery check, progress indicator

- [ ] Commit: `feat: checkout address step`

---

## Task 14: Checkout — Payment

**Files:**
- Create: `src/app/pages/checkout/payment/payment.component.{ts,html,css}`

- [ ] Order summary, coupon, Razorpay + COD options, place order → confirmation

- [ ] Commit: `feat: checkout payment step`

---

## Task 15: Order Confirmation + Tracking

**Files:**
- Create: `src/app/pages/order-confirmation/order-confirmation.component.{ts,html,css}`
- Create: `src/app/pages/order-tracking/order-tracking.component.{ts,html,css}`

- [ ] Confirmation: animated checkmark, order number, ETA, CTAs

- [ ] Tracking: step tracker, order items, cancel button

- [ ] Commit: `feat: order confirmation and tracking pages`

---

## Task 16: Auth — Login + OTP Verify

**Files:**
- Create: `src/app/pages/auth/login/login.component.{ts,html,css}`
- Create: `src/app/pages/auth/otp-verify/otp-verify.component.{ts,html,css}`

- [ ] Login: mobile input, send OTP, "Browse Menu" ghost CTA

- [ ] OTP: 6 individual digit inputs, auto-focus, 30s resend timer, verify → returnUrl

- [ ] Commit: `feat: auth login and OTP verify pages`

---

## Task 17: Profile Pages

**Files:**
- Create: `src/app/pages/profile/profile-home/profile-home.component.{ts,html,css}`
- Create: `src/app/pages/profile/order-history/order-history.component.{ts,html,css}`
- Create: `src/app/pages/profile/order-detail/order-detail.component.{ts,html,css}`

- [ ] Profile home: user info, addresses, theme toggle, logout

- [ ] Order history: cards with status badges, filter tabs, reorder

- [ ] Order detail: full breakdown, timeline, cancel/reorder

- [ ] Commit: `feat: profile, order history, order detail pages`

---

## Task 18: Not Found Page

**Files:**
- Create: `src/app/pages/not-found/not-found.component.{ts,html,css}`

- [ ] 404 layout using bellyBeeLogo, "Go Home" CTA

- [ ] Commit: `feat: 404 not found page`

---

## Task 19: PWA Setup

**Files:**
- Modify: `package.json` (add @angular/pwa, @angular/service-worker)
- Create: `src/ngsw-config.json`
- Modify: `src/app/app.config.ts` (provideServiceWorker)
- Modify: `angular.json` (serviceWorker flag)

- [ ] Install `@angular/service-worker`

- [ ] Create ngsw-config.json

- [ ] Register service worker in app.config.ts

- [ ] Commit: `feat: PWA service worker for offline menu browsing`

---

## Task 20: Dark Mode

**Files:**
- Modify: `src/styles.css` (dark theme variables already in Task 2 — verify they're present)
- Modify: `src/app/pages/profile/profile-home/profile-home.component.ts` (theme toggle wired)
- Modify: `src/app/services/theme.service.ts` (verify on-init loads from localStorage)

- [ ] Verify `[data-theme="dark"]` CSS block exists in styles.css

- [ ] Verify theme.service sets `document.documentElement.setAttribute('data-theme', theme)` on init

- [ ] Verify profile theme toggle calls `themeService.setTheme()`

- [ ] Test dark mode visually at 375px, 768px, 1280px

- [ ] Commit: `feat: dark mode wired through theme service`

---

## Task 21: Final Audit

- [ ] Run `ng build --configuration production` and fix any errors

- [ ] Check `dist/belly-bee/` exists with correct files

- [ ] Verify robots.txt and sitemap.xml are in build output

- [ ] Check browser console: zero errors on /, /menu, /cart, /auth/login

- [ ] Check responsiveness at 375px, 768px, 1280px

- [ ] Commit: `fix: production build audit fixes`

---
