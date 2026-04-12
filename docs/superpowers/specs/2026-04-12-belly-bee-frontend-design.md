# Belly Bee — Frontend Complete Rebuild Design Spec
**Date:** 2026-04-12  
**Project:** belly-bee (Angular 18, Firebase Hosting)  
**Approach:** Mock-First with Service Abstraction (Approach A)  
**Status:** Approved by user

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| App Name | Belly Bee |
| Tagline | Fresh. Fast. Flavorful. |
| Live URL | https://belly-bee.web.app |
| Firebase Project | belly-bee |
| Local Dev API | http://localhost:3000/v1 (NestJS) |
| Angular Version | 18.2 (standalone components) |
| Folder | c:/xampp/htdocs/belly-bites (name kept, project identity is Belly Bee) |

---

## 2. Architecture

### 2.1 Framework Choices
- Angular 18.2, fully standalone (no NgModules)
- All routes lazy-loaded via `loadComponent()`
- No Angular Material (removed — conflicts with custom design system)
- No Bootstrap (removed — replaced by custom CSS)
- Leaflet retained for map in checkout
- PWA via `@angular/pwa`
- No SSR (deferred — Razorpay, Leaflet, geolocation, localStorage are all browser-only)

### 2.2 Directory Structure
```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── services/
│   │   │   └── api.service.ts          ← base HTTP wrapper
│   │   └── mock/
│   │       └── mock-data.service.ts    ← all mock data, Observable returns
│   ├── models/
│   │   ├── category.model.ts
│   │   ├── menu-item.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   ├── address.model.ts
│   │   ├── user.model.ts
│   │   └── coupon.model.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── menu.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── location.service.ts
│   │   ├── coupon.service.ts
│   │   ├── theme.service.ts
│   │   └── analytics.service.ts
│   ├── shared/
│   │   ├── header/
│   │   ├── footer/
│   │   ├── item-card/
│   │   ├── skeleton-loader/
│   │   ├── veg-badge/
│   │   ├── rating-stars/
│   │   ├── price-display/
│   │   ├── toast/
│   │   └── customization-sheet/
│   ├── pages/
│   │   ├── home/                        → /main
│   │   ├── menu/                        → /menu, /menu/:categoryId
│   │   ├── item-detail/                 → /item/:id
│   │   ├── cart/                        → /cart
│   │   ├── checkout/
│   │   │   ├── address/                 → /checkout/address
│   │   │   └── payment/                 → /checkout/payment
│   │   ├── order-confirmation/          → /order-confirmation/:id
│   │   ├── order-tracking/              → /order-tracking/:id
│   │   ├── profile/
│   │   │   ├── profile-home/            → /profile
│   │   │   ├── order-history/           → /profile/orders
│   │   │   └── order-detail/            → /profile/order/:id
│   │   ├── auth/
│   │   │   ├── login/                   → /auth/login
│   │   │   └── otp-verify/              → /auth/otp
│   │   └── not-found/                   → /not-found
│   ├── app.routes.ts
│   ├── app.component.ts
│   └── app.config.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── assets/
│   ├── bellyBeeLogo.webp              (existing)
│   ├── food images...                 (existing)
│   ├── payments/                      (existing)
│   ├── avif-menu/                     (existing)
│   └── icons/                         (PWA icons — generated)
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── index.html
├── main.ts
└── styles.css
```

### 2.3 Mock-First Pattern
Every service checks `environment.useMock`. When true, it returns `of(mockData)` from `MockDataService`. When false, it calls the real `ApiService` HTTP methods. This means the app works with zero backend dependency.

```typescript
// Pattern used by all services
getCategories(): Observable<Category[]> {
  return this.env.useMock
    ? this.mock.getCategories()
    : this.api.get<Category[]>('/catalog/categories');
}
```

---

## 3. Environment Files

### environment.ts (dev — useMock: true until backend is complete)
```typescript
export const environment = {
  production: false,
  useMock: true,
  apiUrl: 'http://localhost:3000/v1',
  firebaseConfig: {
    apiKey: "AIzaSyCQdQZFwXuLaPk-uJskyUJtQ_Pn8OFExlc",
    authDomain: "belly-bee.firebaseapp.com",
    projectId: "belly-bee",
    storageBucket: "belly-bee.firebasestorage.app",
    messagingSenderId: "216584057680",
    appId: "1:216584057680:web:33478ed97f364bd2d6b255",
    measurementId: "G-MTE6NF6TRG"
  },
  razorpayKey: 'rzp_test_mgkjzvurwm33Al'
};
```

### environment.prod.ts (prod — useMock: false)
```typescript
export const environment = {
  production: true,
  useMock: false,
  apiUrl: 'https://api.belly-bee.web.app/v1',
  firebaseConfig: { /* same as dev — same project */ },
  razorpayKey: 'rzp_live_XXXXXXXX'
};
```

---

## 4. Models

### 4.1 category.model.ts
```typescript
export interface Category {
  id: string;
  name: string;
  icon: string;           // emoji or icon name
  image_url: string;
  sort_order: number;
  is_active: boolean;
}
```

### 4.2 menu-item.model.ts
```typescript
export type SpicyLevel = 'mild' | 'medium' | 'hot' | 'extra-hot';
export type ServeOption = 'serve-1' | 'serve-2';
export type SizeOption = 'quarter' | 'half' | 'full' | '250ml' | '500ml' | '1L';
export type ItemTag = 'bestseller' | 'new' | 'offer' | 'chefs-special';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  price: number;
  image_url: string;
  is_available: boolean;
  stock_count: number;
  is_veg: boolean;
  is_drink: boolean;
  spicy_levels: SpicyLevel[];
  serve_options: ServeOption[];
  size_options: SizeOption[];
  tags: ItemTag[];
  discount_percent: number;
  rating: number;
  prep_time_minutes: number;
}
```

### 4.3 cart.model.ts
```typescript
export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  selected_spicy_level?: SpicyLevel;
  selected_serve?: ServeOption;
  selected_size?: SizeOption;
  special_instructions?: string;
  item_total: number;
}
```

### 4.4 order.model.ts
```typescript
export type OrderStatus =
  'pending' | 'confirmed' | 'preparing' |
  'out_for_delivery' | 'delivered' | 'cancelled';

export type PaymentMethod = 'razorpay' | 'cod' | 'upi';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  image_url: string;
  quantity: number;
  unit_price: number;
  selected_spicy_level?: string;
  selected_serve?: string;
  selected_size?: string;
  special_instructions?: string;
  line_total: number;
}

export interface Order {
  order_id: string;
  order_number: string;       // BB-2026-00123
  user_id: string;
  items: OrderItem[];
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id?: string;
  delivery_address: Address;
  subtotal: number;
  discount: number;
  coupon_code?: string;
  coupon_discount: number;
  delivery_fee: number;
  gst: number;
  total: number;
  placed_at: string;          // ISO string
  estimated_delivery: string; // ISO string
  source: 'web' | 'app';
}
```

### 4.5 address.model.ts
```typescript
export interface Address {
  id?: string;
  label: 'Home' | 'Work' | 'Other';
  full_address: string;
  landmark?: string;
  lat: number;
  lng: number;
  pincode: string;
  is_default?: boolean;
}
```

### 4.6 user.model.ts
```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  profile_pic?: string;
  addresses: Address[];
  preferred_theme: 'light' | 'dark';
}
```

### 4.7 coupon.model.ts
```typescript
export interface CouponCode {
  code: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  valid_till: string;
  is_active: boolean;
  description: string;
}
```

---

## 5. Services

### 5.1 auth.service.ts
- `sendOTP(mobile: string): Observable<{ok: boolean, devCode?: string}>`
  - Mock: returns `{ok:true, devCode:'123456'}`; real: `POST /v1/auth/otp/request`
- `verifyOTP(mobile: string, otp: string): Observable<{access: string, user: User}>`
  - Mock: returns fake token + user; real: `POST /v1/auth/otp/verify`
- `getCurrentUser(): User | null` — reads from `localStorage('bb_user')`
- `logout()` — clears `bb_token` + `bb_user` from localStorage
- `isLoggedIn(): boolean`
- `user$: BehaviorSubject<User | null>`
- JWT stored in localStorage as `bb_token`

### 5.2 menu.service.ts
- `getCategories(): Observable<Category[]>`
  - Real: `GET /v1/catalog/categories`
- `getMenuItems(categoryId?: string): Observable<MenuItem[]>`
  - Real: `GET /v1/catalog/items?category={id}`
- `getItemById(id: string): Observable<MenuItem>`
  - Real: `GET /v1/catalog/items/{id}`
- `searchItems(query: string): Observable<MenuItem[]>`
  - Real: `GET /v1/catalog/items?q={query}`

### 5.3 cart.service.ts
- Full cart state in `BehaviorSubject<CartItem[]>` persisted in localStorage as `bb_cart`
- `addToCart(item: MenuItem, options: CartOptions): void`
- `removeFromCart(itemId: string): void`
- `updateQuantity(itemId: string, qty: number): void`
- `clearCart(): void`
- `cartItems$: Observable<CartItem[]>`
- `cartCount$: Observable<number>`
- `cartTotal$: Observable<number>`
- When user is logged in AND `!useMock`: syncs cart to `POST /v1/cart/add`

### 5.4 order.service.ts
- Mock: stores orders in localStorage as `bb_orders`, generates order numbers
- `placeOrder(payload): Observable<Order>`
  - Real: `POST /v1/orders`
- `getOrderHistory(): Observable<Order[]>`
  - Real: `GET /v1/orders`
- `getOrderById(id: string): Observable<Order>`
  - Real: `GET /v1/orders/{id}`
- `trackOrder(id: string): Observable<OrderTrackingInfo>`
  - Real: `GET /v1/orders/{id}/track`
- `cancelOrder(id: string): Observable<Order>`
  - Real: `PUT /v1/orders/{id}/cancel`

### 5.5 payment.service.ts
- `initRazorpay(amount: number, orderId: string): Promise<PaymentResult>`
  - Loads Razorpay SDK dynamically. Opens checkout modal.
  - Key from `environment.razorpayKey`
- `createPaymentOrder(amount: number): Observable<RazorpayOrder>`
  - Real: `POST /v1/payments/create-order`
- `verifyPayment(data: RazorpayPaymentData): Observable<{success: boolean}>`
  - Real: `POST /v1/payments/verify`

### 5.6 location.service.ts
- `getCurrentLocation(): Promise<{lat: number, lng: number}>`
- `reverseGeocode(lat: number, lng: number): Observable<AddressSuggestion>`
  - Uses OpenStreetMap Nominatim (free, no API key)
- `searchAddress(query: string): Observable<AddressSuggestion[]>`

### 5.7 coupon.service.ts
- Mock: hardcoded coupons `FLAT50`, `BB10`, `FIRST100`
- `applyCoupon(code: string, cartTotal: number): Observable<CouponResult>`
  - Real: `POST /v1/coupons/apply`
- `activeCoupon$: BehaviorSubject<CouponCode | null>`
- `removeCoupon(): void`

### 5.8 theme.service.ts
- `currentTheme$: BehaviorSubject<'light' | 'dark'>`
- `setTheme(theme): void` — writes `data-theme` on `<html>`, saves to localStorage
- On init: loads from localStorage first, then user preferences if logged in
- Real (when backend supports): `PUT /v1/users/me/preferences`

### 5.10 toast.service.ts
- `show(message: string, type: 'success'|'error'|'info', duration?: number): void`
- Drives the global `ToastComponent` via a `BehaviorSubject<Toast[]>`
- Used by error interceptor (500 errors), cart service (item added), order service (placed/cancelled)

### 5.11 analytics.service.ts
- Tracks events: `page_view`, `item_view`, `add_to_cart`, `checkout_started`,
  `payment_page_reached`, `payment_abandoned`, `order_placed`
- Reads UTM params from URL on first load: `utm_source`, `utm_medium`, `utm_campaign`
- Mock: logs to `console.debug` only
- Real: `POST /v1/analytics/track` (backend to build)

---

## 6. Shared Components

### 6.1 HeaderComponent
- Logo (links to `/main`)
- Desktop nav: Home, Menu, Offers
- Cart icon with live badge count from `cart.service.cartCount$`
- Profile icon (links to `/profile` or `/auth/login`)
- Hamburger on mobile
- Glassmorphism on scroll: `backdrop-filter: blur(12px); background: rgba(255,253,247,0.85)`

### 6.2 FooterComponent
- Brand + tagline
- Quick links (Menu, Offers, Contact)
- Social icons (Instagram, WhatsApp)
- Address + contact email
- Copyright

### 6.3 ItemCardComponent
- Inputs: `item: MenuItem`, `(addToCart): EventEmitter`
- Shows: image (NgOptimizedImage), veg badge, rating, prep time, discount badge
- "+" button opens customization sheet
- "Sold Out" overlay when `!item.is_available`
- "Only N left!" when `item.stock_count < 5`
- Hover: lift with box-shadow

### 6.4 CustomizationSheetComponent
- Bottom sheet animation (slides up)
- Spicy level radio selector (only if `item.spicy_levels.length > 0`)
- Serve option radio selector (only if `item.serve_options.length > 0`)
- Size/portion radio selector (only if `item.size_options.length > 0`)
- Special instructions textarea (max 100 chars)
- Quantity stepper
- CTA: "Add to cart — ₹{computed price}"
- Closes on backdrop click or swipe down

### 6.5 SkeletonLoaderComponent
- Input: `type: 'card' | 'list' | 'text' | 'hero'`
- Shimmer animation via CSS `@keyframes`

### 6.6 ToastComponent
- Global toast notification (success / error / info)
- Injects via `ToastService`
- Auto-dismisses after 3 seconds
- Stacks up to 3 toasts

### 6.7 VegBadgeComponent
- Green square for veg, red square for non-veg (FSSAI standard)

### 6.8 RatingStarsComponent
- Input: `rating: number` (0–5)
- Renders filled/half/empty stars

---

## 7. Pages

### 7.1 HomeComponent (/main)
- Hero: animated tagline, "Order Now" CTA → `/menu`
- Category chips: horizontal scroll, click → `/menu/:categoryId`
- "Popular This Week": 6 items from `tags.includes('bestseller')`
- "New Arrivals": items with `tags.includes('new')`
- Offer strip: items with `discount_percent > 0`
- All data from `MenuService` with skeleton loaders
- SEO: title "Belly Bee | Order Fresh Food Online", OG tags, structured data

### 7.2 MenuComponent (/menu, /menu/:categoryId)
- Left sticky category sidebar (desktop) / top scroll tabs (mobile)
- Search bar with 300ms debounce
- Filters: Veg Only toggle, Spicy, Discounted, Top Rated, Sort (Price/Rating/PrepTime)
- Grid of `ItemCardComponent`
- Skeleton loaders (8 cards while fetching)
- Reads `:categoryId` from route params and applies filter

### 7.3 ItemDetailComponent (/item/:id)
- Full-width image
- Name, description, rating, prep time
- Customization options (same as bottom sheet but inline)
- Add to cart + Buy Now CTAs
- Related items section (same category) — uses `MenuService.getMenuItems(item.category_id)` filtered to exclude current item, limited to 4

### 7.4 CartComponent (/cart)
- Item list: each row shows image, name, customization summary, qty controls, line total
- Remove button per item
- Coupon input with `CouponService`
- Price breakdown: Subtotal, Coupon Discount, GST (5%), Delivery Fee, Total
- "Proceed to Checkout" → `/checkout/address`
- Empty state: illustration + "Explore Menu" CTA

### 7.5 AddressComponent (/checkout/address)
- Saved addresses from `CartService` checkout state + `localStorage('bb_addresses')` in mock mode; `GET /v1/addresses` in live mode
- "Add New Address" form with Leaflet map picker
- "Use current location" button
- Delivery availability check
- "Continue to Payment" → `/checkout/payment`
- Progress indicator: Address → Payment

### 7.6 PaymentComponent (/checkout/payment)
- Collapsed order summary (expandable)
- Coupon apply if not already applied
- Payment options: Razorpay (card/UPI/netbanking), COD
- "Place Order" button
- On Razorpay: `PaymentService.initRazorpay()` → on success → `/order-confirmation/:id`
- On COD: `OrderService.placeOrder()` → `/order-confirmation/:id`
- Analytics: tracks `payment_page_reached`

### 7.7 OrderConfirmationComponent (/order-confirmation/:id)
- CSS animated checkmark (green, bounce-in)
- Order number: BB-2026-XXXXX
- Estimated delivery time
- Order summary
- "Track Order" → `/order-tracking/:id`
- "Back to Home" → `/main`

### 7.8 OrderTrackingComponent (/order-tracking/:id)
- Visual step tracker: Placed → Confirmed → Preparing → Out for Delivery → Delivered
- Active step highlighted with amber color
- Order items summary
- Cancel button (only if status is 'pending' or 'confirmed')

### 7.9 ProfileComponent (/profile) — auth-guarded
- User avatar (placeholder bee icon if no pic), name, mobile
- Edit profile form (name, email)
- Saved addresses card (list + add/delete)
- Theme toggle (Light / Dark) — calls `ThemeService`
- "My Orders" card → `/profile/orders`
- Logout button

### 7.10 OrderHistoryComponent (/profile/orders) — auth-guarded
- Order cards: number, date, status badge, item count, total, payment icon
- Filter tabs: All / Active / Completed / Cancelled
- "View Details" → `/profile/order/:id`
- "Reorder" button (re-adds items to cart)

### 7.11 OrderDetailComponent (/profile/order/:id) — auth-guarded
- Full order breakdown
- Each item: name, customizations, qty, price
- Delivery address
- Payment method + masked reference
- Price breakdown
- Order timeline (step tracker)
- Cancel button (if eligible)
- "Reorder" button

### 7.12 LoginComponent (/auth/login)
- Mobile number input (+91 prefix)
- "Send OTP" → navigates to `/auth/otp`
- "Browse Menu" ghost CTA

### 7.13 OtpVerifyComponent (/auth/otp)
- 6 individual digit inputs (auto-focus next on input)
- 30-second resend timer
- On verify success: redirects to `returnUrl` or `/main`

### 7.14 NotFoundComponent (/not-found)
- Bee illustration (using bellyBeeLogo.webp in a creative 404 layout)
- "Go Home" CTA

---

## 8. Routing

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  { path: 'main',      loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'menu',      loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent) },
  { path: 'menu/:categoryId', loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent) },
  { path: 'item/:id',  loadComponent: () => import('./pages/item-detail/item-detail.component').then(m => m.ItemDetailComponent) },
  { path: 'cart',      loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) },
  {
    path: 'checkout', children: [
      { path: '',       redirectTo: 'address', pathMatch: 'full' },
      { path: 'address', loadComponent: () => import('./pages/checkout/address/address.component').then(m => m.AddressComponent) },
      { path: 'payment', loadComponent: () => import('./pages/checkout/payment/payment.component').then(m => m.PaymentComponent) }
    ]
  },
  { path: 'order-confirmation/:id', loadComponent: () => import('./pages/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent) },
  { path: 'order-tracking/:id',     loadComponent: () => import('./pages/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent) },
  {
    path: 'profile', canActivate: [authGuard], children: [
      { path: '',          loadComponent: () => import('./pages/profile/profile-home/profile-home.component').then(m => m.ProfileHomeComponent) },
      { path: 'orders',    loadComponent: () => import('./pages/profile/order-history/order-history.component').then(m => m.OrderHistoryComponent) },
      { path: 'order/:id', loadComponent: () => import('./pages/profile/order-detail/order-detail.component').then(m => m.OrderDetailComponent) }
    ]
  },
  { path: 'auth/login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/otp',   loadComponent: () => import('./pages/auth/otp-verify/otp-verify.component').then(m => m.OtpVerifyComponent) },
  { path: 'not-found',  loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: '**',         redirectTo: 'not-found' }
];
```

---

## 9. UI Design System

### 9.1 CSS Variables (styles.css)
```css
:root {
  --primary:      #F5A623;
  --primary-dark: #D4881A;
  --secondary:    #2C2C2C;
  --accent:       #E84444;
  --bg:           #FFFDF7;
  --card:         #FFFFFF;
  --ink:          #1A1A1A;
  --muted:        #6B6B6B;
  --success:      #27AE60;
  --warning:      #F39C12;
  --border:       #EEE8DC;
  --radius-sm:    8px;
  --radius-md:    14px;
  --radius-lg:    20px;
  --shadow-sm:    0 2px 8px rgba(0,0,0,.06);
  --shadow-md:    0 8px 24px rgba(0,0,0,.10);
  --shadow-lg:    0 16px 48px rgba(0,0,0,.14);
  --transition:   all 0.15s ease;
}

[data-theme="dark"] {
  --bg:     #1A1A1A;
  --card:   #2C2C2C;
  --ink:    #F5F5F5;
  --muted:  #AAAAAA;
  --border: #3A3A3A;
}
```

### 9.2 Typography (index.html Google Fonts)
- `Playfair Display` — h1, h2, hero text
- `DM Sans` — body, UI labels, prices
- `Caveat` — special badges ("Chef's Special", "Limited Time Offer")

### 9.3 Motion
| Interaction | Animation |
|-------------|-----------|
| Page transition | fade + slide-up 150ms |
| Card hover | translateY(-4px), shadow-md |
| Add-to-cart button | ripple + scale bounce |
| Bottom sheet open | slide-up 250ms cubic-bezier |
| Toast appear | slide-in from right |
| Skeleton shimmer | linear gradient sweep |
| Header on scroll | blur transition 200ms |
| Checkmark (confirmation) | stroke-dashoffset 600ms |

---

## 10. Mock Data Summary

### Categories (10)
Morning Buzz, Indian South Style, Veg Long Bowls, Breads & Rice, Sandwich Binge, Burger Blast, Rolls & Boxes, Meals & Combos, Loaded Without Boxes, Tacos for Tikkas

### Items (35 — from actual Belly Bee menu photos)
Minimum 3 items per category. All with:
- Real names, descriptions, correct is_veg flag
- Price ranges: ₹70–₹350
- Spicy levels where applicable
- Size options for rice/curry items
- Serve options (serve-1, serve-2) where applicable
- Tags: bestseller/new/offer distributed across items
- Ratings: 3.8–4.8
- Prep times: 10–35 min
- Items that match existing assets use `assets/chicken-biryani.jpg` etc. Items without a matching image use `assets/bellyBeeLogo.webp` as a styled placeholder (centered, padded, on cream background). No external image URLs used.

### Coupons (mock)
| Code | Type | Value | Min Order |
|------|------|-------|-----------|
| FLAT50 | flat | ₹50 | ₹399 |
| BB10 | percent | 10% | ₹199 |
| FIRST100 | flat | ₹100 | ₹499 |

---

## 11. SEO Implementation

### index.html additions
- Google Fonts preload (Playfair Display, DM Sans, Caveat)
- JSON-LD structured data (Restaurant schema)
- Meta: description, OG tags, Twitter card
- `<link rel="canonical">`

### Per-component (Angular Title + Meta services)
Every component's `ngOnInit` calls:
```typescript
this.title.setTitle('Page Title | Belly Bee');
this.meta.updateTag({ name: 'description', content: '...' });
this.meta.updateTag({ property: 'og:title', content: '...' });
```

### public/robots.txt
```
User-agent: *
Allow: /
Disallow: /checkout
Disallow: /cart
Disallow: /profile
Disallow: /auth
Sitemap: https://belly-bee.web.app/sitemap.xml
```

### public/sitemap.xml
Static sitemap with: /, /menu, /menu/* per category, /item/* per item

---

## 12. Build Configuration Fixes

### angular.json changes
- `outputPath`: `dist/belly-bites` → `dist/belly-bee`
- Remove `@angular/material/prebuilt-themes/cyan-orange.css` from styles
- Remove `bootstrap.min.css` from styles
- Remove `bootstrap.bundle.min.js` from scripts
- Keep Leaflet CSS and assets

### package.json
- `"name"`: `belly-bites` → `belly-bee`
- PWA: manually install `@angular/pwa` package + add `ngsw-config.json` + register service worker in `app.config.ts` via `provideServiceWorker()`

### firebase.json
- Already correct: `"public": "dist/belly-bee"` ✅

---

## 13. Backend Contract (Guidelines for Backend Development)

When the backend is ready, these are the exact endpoints the frontend expects.
The frontend `environment.useMock` is set to `false` to enable live integration.

### Auth
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | /v1/auth/otp/request | `{phone: string}` | `{ok: true, devCode?: string}` | None |
| POST | /v1/auth/otp/verify | `{phone: string, code: string}` | `{access: string, user: User}` | None |
| GET | /v1/auth/me | — | `User` | JWT |

### Catalog (needs to be made public — currently admin-only)
| Method | Path | Query | Response | Auth |
|--------|------|-------|----------|------|
| GET | /v1/catalog/categories | — | `Category[]` | None |
| GET | /v1/catalog/items | `?category={id}&q={search}` | `MenuItem[]` | None |
| GET | /v1/catalog/items/:id | — | `MenuItem` | None |

**Note:** The existing CatalogController in the backend has `@UseGuards(JwtAuthGuard, AdminGuard)` — this must be removed for customer-facing reads. Catalog module must also be added to `app.module.ts`.

### Cart
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | /v1/cart | — | `CartDTO` | JWT |
| POST | /v1/cart/add | `{itemId, variantId?, qty}` | `CartDTO` | JWT |
| POST | /v1/cart/set | `{cartItemId, qty}` | `CartDTO` | JWT |
| POST | /v1/cart/remove | `{cartItemId}` | `CartDTO` | JWT |
| GET | /v1/cart/totals | — | `TotalsDTO` | JWT |

### Orders (needs to be built)
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | /v1/orders | `OrderCreateDTO` | `Order` | JWT |
| GET | /v1/orders | `?status={status}` | `Order[]` | JWT |
| GET | /v1/orders/:id | — | `Order` | JWT |
| GET | /v1/orders/:id/track | — | `OrderTrackingInfo` | JWT |
| PUT | /v1/orders/:id/cancel | — | `Order` | JWT |

### Addresses (needs to be built)
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | /v1/addresses | — | `Address[]` | JWT |
| POST | /v1/addresses | `AddressDTO` | `Address` | JWT |
| PUT | /v1/addresses/:id | `AddressDTO` | `Address` | JWT |
| DELETE | /v1/addresses/:id | — | `{ok: true}` | JWT |

### Payments
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | /v1/payments/create-order | — | `{rzpOrderId, amount, currency, keyId}` | JWT |
| POST | /v1/payments/verify | `RazorpayVerifyDTO` | `{success: boolean}` | JWT |

### Coupons (needs to be built)
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | /v1/coupons/apply | `{code: string, cart_total: number}` | `CouponResult` | JWT/None |

### User Preferences (needs to be built)
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| PUT | /v1/users/me/preferences | `{preferred_theme: 'light'\|'dark'}` | `User` | JWT |

### Analytics (needs to be built)
| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | /v1/analytics/track | `{event: string, properties: object}` | `{ok: true}` | None |

---

## 14. Fixes Applied vs Original Code

| Issue | Fix |
|-------|-----|
| `outputPath: dist/belly-bites` | → `dist/belly-bee` |
| `environment.prod.ts` blank Firebase | → same config as dev (same project) |
| Angular Material + Bootstrap in bundle | → removed from angular.json styles/scripts |
| `apiBase` key | → `apiUrl` |
| `bb_access` token key | → `bb_token` |
| No lazy loading | → all routes use `loadComponent()` |
| Razorpay key hardcoded in component | → `environment.razorpayKey` |
| No auth guard | → `authGuard` on `/profile/**` only. Checkout allows guest use; login is prompted post-order optionally. |
| No error interceptor | → 401 auto-logout, 500 toast error |
| No models folder | → `src/app/models/` with full interfaces |
| No shared components | → full shared/ directory |
| Wrong fonts (Roboto only) | → Playfair Display + DM Sans + Caveat |
| Wrong color palette | → Honey amber #F5A623 as primary |
| Catalog module not in app.module | → documented as backend fix needed |

---

## 15. Implementation Order (for writing-plans)

1. **Foundation** — Fix angular.json, environments, package.json, styles.css, index.html, fonts, CSS variables, PWA, robots.txt, sitemap.xml
2. **Models** — All TypeScript interfaces in src/app/models/
3. **Core** — auth.guard, auth.interceptor, error.interceptor, api.service
4. **Mock Data** — mock-data.service.ts with 10 categories + 35 items + coupons
5. **Services** — auth, menu, cart, order, payment, location, coupon, theme, analytics
6. **Shared Components** — header, footer, item-card, skeleton-loader, veg-badge, rating-stars, price-display, toast, customization-sheet
7. **App Shell** — app.component (header + footer wrapper), app.routes.ts
8. **Home Page** — hero, categories, popular, new arrivals, offers
9. **Menu Page** — category sidebar, search, filters, item grid
10. **Item Detail Page**
11. **Cart Page**
12. **Checkout Flow** — address + payment
13. **Order Confirmation + Tracking**
14. **Auth Pages** — login + OTP verify
15. **Profile + Order History + Order Detail**
16. **Not Found Page**
17. **SEO** — meta tags in every component, structured data, canonical
18. **Dark Mode** — theme toggle + CSS variable switching
19. **Animations** — page transitions, card hover, add-to-cart ripple, skeleton shimmer
20. **Final audit** — console errors, responsive check (375/768/1280), production build test
