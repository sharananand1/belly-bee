import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../../models/category.model';
import { MenuItem } from '../../models/menu-item.model';
import { Order, OrderStatus, TrackingStep } from '../../models/order.model';
import { Address } from '../../models/address.model';
import { User } from '../../models/user.model';
import { CouponCode, CouponResult } from '../../models/coupon.model';

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { id: 'morning-buzz',        name: 'Morning Buzz',              icon: '🥞', image_url: 'assets/bellyBeeLogo.webp', sort_order: 1,  is_active: true },
  { id: 'indian-south-buzz',   name: 'Indian South Buzz',         icon: '🥟', image_url: 'assets/bellyBeeLogo.webp', sort_order: 2,  is_active: true },
  { id: 'day-long-buzz',       name: 'Day Long Buzz',             icon: '🍛', image_url: 'assets/bellyBeeLogo.webp', sort_order: 3,  is_active: true },
  { id: 'breads-rice',         name: 'Breads & Rice',             icon: '🍚', image_url: 'assets/veg-pulao.jpg',     sort_order: 4,  is_active: true },
  { id: 'sandwich-stings',     name: 'Sandwich Stings',           icon: '🥪', image_url: 'assets/bellyBeeLogo.webp', sort_order: 5,  is_active: true },
  { id: 'burger-buzz',         name: 'Burger Buzz',               icon: '🍔', image_url: 'assets/bellyBeeLogo.webp', sort_order: 6,  is_active: true },
  { id: 'pizza-hive',          name: 'Pizza Hive',                icon: '🍕', image_url: 'assets/bellyBeeLogo.webp', sort_order: 7,  is_active: true },
  { id: 'rolls-roars',         name: 'Rolls & Roars',             icon: '🌯', image_url: 'assets/chicken-shawarma.webp', sort_order: 8, is_active: true },
  { id: 'noody-noodles',       name: 'Noody Noodles',             icon: '🍜', image_url: 'assets/bellyBeeLogo.webp', sort_order: 9,  is_active: true },
  { id: 'takka-tak-tikkas',    name: 'Takka Tak Tikkas',          icon: '🍢', image_url: 'assets/chik.webp',         sort_order: 10, is_active: true },
  { id: 'buzzed-without-booze',name: 'Buzzed Without Booze',      icon: '🧃', image_url: 'assets/bellyBeeLogo.webp', sort_order: 11, is_active: true },
];

// ─────────────────────────────────────────────
// MENU ITEMS (72 real items from Belly Bee menu)
// ─────────────────────────────────────────────
const ITEMS: MenuItem[] = [

  // ── MORNING BUZZ ─────────────────────────
  {
    id: 'mb-001', name: 'Aloo Parantha',
    description: 'Flaky paratha bursting with zesty potato filling, kissed with desi ghee.',
    category_id: 'morning-buzz', category_name: 'Morning Buzz',
    price: 90, variant_prices: { 'serve-1': 90, 'serve-2': 160 },
    image_url: 'assets/aloo-gobi.jpg', is_available: true, stock_count: 50,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.5, prep_time_minutes: 12,
  },
  {
    id: 'mb-002', name: 'Aalu Pyaz Parantha',
    description: 'Spiced potato-onion mix tucked in ghee-roasted golden layers.',
    category_id: 'morning-buzz', category_name: 'Morning Buzz',
    price: 110, variant_prices: { 'serve-1': 110, 'serve-2': 190 },
    image_url: 'assets/aloo-gobi.jpg', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 12,
  },
  {
    id: 'mb-003', name: 'Paneer Parantha',
    description: 'Soft flatbread filled with spicy paneer, cooked golden with ghee.',
    category_id: 'morning-buzz', category_name: 'Morning Buzz',
    price: 130, variant_prices: { 'serve-1': 130, 'serve-2': 220 },
    image_url: 'assets/paneer-butter-masala.jpg', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.6, prep_time_minutes: 14,
  },
  {
    id: 'mb-004', name: 'Gobhi Parantha',
    description: 'Crisp paratha with spiced cauliflower stuffing, rich in homestyle warmth.',
    category_id: 'morning-buzz', category_name: 'Morning Buzz',
    price: 130, variant_prices: { 'serve-1': 130, 'serve-2': 220 },
    image_url: 'assets/aloo-gobi.jpg', is_available: true, stock_count: 35,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 14,
  },
  {
    id: 'mb-005', name: 'Chicken Keema Parantha',
    description: 'Soft flatbread packed with minced chicken, slow-cooked with spices & sealed in ghee.',
    category_id: 'morning-buzz', category_name: 'Morning Buzz',
    price: 210, variant_prices: { 'serve-1': 210, 'serve-2': 360 },
    image_url: 'assets/chik.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.7, prep_time_minutes: 18,
  },

  // ── INDIAN SOUTH BUZZ ──────────────────────
  {
    id: 'isb-001', name: 'Idli (4 / 8 pieces)',
    description: 'Soft steamed idlis served with velvety sambar and creamy chutney.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 270, variant_prices: { 'serve-1': 270, 'serve-2': 430 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 50,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 10,
  },
  {
    id: 'isb-002', name: 'Masala Dosa',
    description: 'Crispy dosa filled with spiced potatoes, served hot with chutneys.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 230, variant_prices: { 'serve-1': 230, 'serve-2': 370 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.6, prep_time_minutes: 15,
  },
  {
    id: 'isb-003', name: 'Plain Ghee Roast Dosa',
    description: 'Golden, paper-thin dosa cooked to crisp perfection, simplicity at its finest.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 180, variant_prices: { 'serve-1': 180, 'serve-2': 310 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 12,
  },
  {
    id: 'isb-004', name: 'Paneer Ghee Roast Dosa',
    description: 'Dosa meets paneer stuffing for a spicy, cheesy South Indian twist.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 250, variant_prices: { 'serve-1': 250, 'serve-2': 390 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 35,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['new'], discount_percent: 0, rating: 4.5, prep_time_minutes: 15,
  },
  {
    id: 'isb-005', name: 'Rawa Masala Dosa',
    description: 'A semolina-based delight filled with spiced potato masala, offering crunchy flavour in every bite.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 270, variant_prices: { 'serve-1': 270, 'serve-2': 430 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 15,
  },
  {
    id: 'isb-006', name: 'Chicken Keema Dosa',
    description: 'Fiery dosa stuffed with spiced chicken masala, a South-meets-North explosion of flavour.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 280, variant_prices: { 'serve-1': 280, 'serve-2': 440 },
    image_url: 'assets/chik.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot', 'extra-hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.7, prep_time_minutes: 18,
  },
  {
    id: 'isb-007', name: 'Uttapam',
    description: 'Soft, thick uttapam topped with colorful veggies, bringing texture and taste in every bite.',
    category_id: 'indian-south-buzz', category_name: 'Indian South Buzz',
    price: 160, variant_prices: { 'serve-1': 160, 'serve-2': 220 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 14,
  },

  // ── DAY LONG BUZZ ─────────────────────────
  {
    id: 'dlb-001', name: 'Chicken Korma',
    description: 'Creamy Indian chicken curry slow-cooked with spices and cashew richness.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 370, variant_prices: { 'quarter': 370, 'half': 520, 'full': 590 },
    image_url: 'assets/butter-chicken.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['bestseller'], discount_percent: 0, rating: 4.6, prep_time_minutes: 25,
  },
  {
    id: 'dlb-002', name: 'Kadhai Chicken',
    description: 'Fiery kadhai masala chicken with peppers and bold Indian spices.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 370, variant_prices: { 'quarter': 370, 'half': 520, 'full': 590 },
    image_url: 'assets/chik.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: [], discount_percent: 0, rating: 4.5, prep_time_minutes: 25,
  },
  {
    id: 'dlb-003', name: 'Malai Chicken',
    description: 'Succulent chicken simmered in a creamy, mildly spiced white gravy.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 390, variant_prices: { 'quarter': 390, 'half': 550, 'full': 830 },
    image_url: 'assets/chik.webp', is_available: true, stock_count: 20,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['new'], discount_percent: 0, rating: 4.5, prep_time_minutes: 25,
  },
  {
    id: 'dlb-004', name: 'Mutton Kofta',
    description: 'Juicy mutton meatballs simmered in rich, spiced gravy, served hot for a royal touch.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 530, variant_prices: { 'quarter': 530, 'half': 740, 'full': 850 },
    image_url: 'assets/mutton-korma.jpeg', is_available: true, stock_count: 20,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.8, prep_time_minutes: 35,
  },
  {
    id: 'dlb-005', name: 'Paneer Butter Masala',
    description: 'Rich and creamy paneer curry — soft paneer cubes simmered in buttery tomato-rich gravy.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 320, variant_prices: { 'quarter': 320, 'half': 450, 'full': 510 },
    image_url: 'assets/paneer-butter-masala.jpg', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['bestseller'], discount_percent: 10, rating: 4.7, prep_time_minutes: 20,
  },
  {
    id: 'dlb-006', name: 'Shahi Paneer',
    description: 'Royal paneer dish in creamy cashew-onion tomato gravy.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 320, variant_prices: { 'quarter': 320, 'half': 450, 'full': 510 },
    image_url: 'assets/paneer-butter-masala.jpg', is_available: true, stock_count: 35,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: [], discount_percent: 0, rating: 4.5, prep_time_minutes: 20,
  },
  {
    id: 'dlb-007', name: 'Matar Paneer',
    description: 'Peas and paneer simmered in a tangy, spiced tomato base.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 320, variant_prices: { 'quarter': 320, 'half': 450, 'full': 510 },
    image_url: 'assets/paneer-butter-masala.jpg', is_available: true, stock_count: 35,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 20,
  },
  {
    id: 'dlb-008', name: 'Kadhai Chaap (Soya)',
    description: 'Soya chaap cooked in rustic kadhai spices and capsicum.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 260, variant_prices: { 'quarter': 260, 'half': 370, 'full': 420 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['new'], discount_percent: 0, rating: 4.3, prep_time_minutes: 20,
  },
  {
    id: 'dlb-009', name: 'Malai Chaap',
    description: 'Creamy soya chaap marinated and slow-cooked in malai gravy.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 280, variant_prices: { 'quarter': 280, 'half': 410, 'full': 470 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 22,
  },
  {
    id: 'dlb-010', name: 'Veg Biryani',
    description: 'Fragrant vegetable rice with potatoes and aromatic biryani spices.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 210, variant_prices: { 'quarter': 210, 'half': 300, 'full': 340 },
    image_url: 'assets/veg-pulao.jpg', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 25,
  },
  {
    id: 'dlb-011', name: 'Egg Biryani',
    description: 'Basmati rice and masala eggs, spiced for ultimate comfort.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 260, variant_prices: { 'quarter': 260, 'half': 370, 'full': 420 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 35,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 25,
  },
  {
    id: 'dlb-012', name: 'Chicken Biryani',
    description: 'Aromatic basmati rice layered with chicken, slow-cooked to perfection.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 320, variant_prices: { 'quarter': 320, 'half': 450, 'full': 510 },
    image_url: 'assets/chicken-biryani.jpg', is_available: true, stock_count: 40,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['bestseller'], discount_percent: 0, rating: 4.7, prep_time_minutes: 30,
  },
  {
    id: 'dlb-013', name: 'Mutton Biryani',
    description: 'Juicy mutton and spiced rice, slow-cooked dum-style magic.',
    category_id: 'day-long-buzz', category_name: 'Day Long Buzz',
    price: 470, variant_prices: { 'quarter': 470, 'half': 660, 'full': 750 },
    image_url: 'assets/mutton-korma.jpeg', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: [], size_options: ['quarter', 'half', 'full'],
    tags: ['chefs-special', 'bestseller'], discount_percent: 0, rating: 4.8, prep_time_minutes: 35,
  },

  // ── BREADS & RICE ─────────────────────────
  {
    id: 'br-001', name: 'Steamed Rice',
    description: 'Fluffy long-grain basmati rice, perfect with any rich Indian curry. A Must Try item.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 130, variant_prices: { 'serve-1': 130, 'serve-2': 220 },
    image_url: 'assets/veg-pulao.jpg', is_available: true, stock_count: 60,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.0, prep_time_minutes: 10,
  },
  {
    id: 'br-002', name: 'Jeera Rice',
    description: 'Similar to steamed rice but fragrant cumin-infused and lightly tossed in ghee.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 160, variant_prices: { 'serve-1': 160, 'serve-2': 280 },
    image_url: 'assets/veg-pulao.jpg', is_available: true, stock_count: 50,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.1, prep_time_minutes: 12,
  },
  {
    id: 'br-003', name: 'Fried Veggie Rice',
    description: 'Long-grain rice stir-fried with seasonal veggies, tossed in oil and spices for a wholesome flavour.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 280, variant_prices: { 'serve-1': 280, 'serve-2': 390 },
    image_url: 'assets/pineapple-rice.jpg', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 15,
  },
  {
    id: 'br-004', name: 'Fried Chicken Rice',
    description: 'Classic fried rice with juicy chicken chunks, crunchy veggies and a wok-kissed smoky flavour.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 330, variant_prices: { 'serve-1': 330, 'serve-2': 500 },
    image_url: 'assets/chicken-biryani.jpg', is_available: true, stock_count: 35,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 18,
  },
  {
    id: 'br-005', name: 'Roti (Plain)',
    description: 'Soft whole wheat flatbread made from MP Sharbati atta, fresh off the tawa.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 30, variant_prices: { 'serve-1': 30, 'serve-2': 40 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 100,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.0, prep_time_minutes: 5,
  },
  {
    id: 'br-006', name: 'Laccha Parantha',
    description: 'Flaky, layered paratha made golden with desi ghee.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 60, variant_prices: { 'serve-1': 60, 'serve-2': 90 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 60,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 8,
  },
  {
    id: 'br-007', name: 'Tawa Naan',
    description: 'Tandoor-style naan made on tawa, soft and chewy delight.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 60, variant_prices: { 'serve-1': 60, 'serve-2': 90 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 60,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.1, prep_time_minutes: 8,
  },
  {
    id: 'br-008', name: 'Raita (Boondi / Veg)',
    description: 'Cool curd raita with crisp boondi or fresh veggies.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 110, variant_prices: { 'serve-1': 110, 'serve-2': 190 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 50,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.0, prep_time_minutes: 5,
  },
  {
    id: 'br-009', name: 'Fresh Salad',
    description: 'Crunchy seasonal vegetables with a lemony zing.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 110, variant_prices: { 'serve-1': 110, 'serve-2': 190 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 50,
    is_veg: true, is_drink: false,
    spicy_levels: [], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.0, prep_time_minutes: 5,
  },
  {
    id: 'br-010', name: 'Fresh Chicken Salad',
    description: 'Fresh chicken chunks tossed with greens, cucumbers and tangy herbs for a wholesome protein-packed salad.',
    category_id: 'breads-rice', category_name: 'Breads & Rice',
    price: 200, variant_prices: { 'serve-1': 200, 'serve-2': 340 },
    image_url: 'assets/chik.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['new'], discount_percent: 0, rating: 4.3, prep_time_minutes: 10,
  },

  // ── SANDWICH STINGS ───────────────────────
  {
    id: 'ss-001', name: 'Chicken Grilled Sandwich',
    description: 'Herbed chicken sandwich with creamy mayo in toasted bread.',
    category_id: 'sandwich-stings', category_name: 'Sandwich Stings',
    price: 260, variant_prices: { 'serve-1': 260, 'serve-2': 420 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.5, prep_time_minutes: 12,
  },
  {
    id: 'ss-002', name: 'Chicken Keema Sandwich',
    description: 'Minced chicken keema cooked with spices, layered inside grilled bread.',
    category_id: 'sandwich-stings', category_name: 'Sandwich Stings',
    price: 280, variant_prices: { 'serve-1': 280, 'serve-2': 450 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 14,
  },
  {
    id: 'ss-003', name: 'Mutton Keema Sandwich',
    description: 'Spicy minced mutton keema melting in toasted bread with a creamy touch.',
    category_id: 'sandwich-stings', category_name: 'Sandwich Stings',
    price: 360, variant_prices: { 'serve-1': 360, 'serve-2': 580 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 20,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.6, prep_time_minutes: 16,
  },
  {
    id: 'ss-004', name: 'Veg Grilled Sandwich',
    description: 'Grilled cheesy sandwich with crunchy veggies and peppery seasoning.',
    category_id: 'sandwich-stings', category_name: 'Sandwich Stings',
    price: 160, variant_prices: { 'serve-1': 160, 'serve-2': 260 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['offer'], discount_percent: 15, rating: 4.2, prep_time_minutes: 10,
  },
  {
    id: 'ss-005', name: 'Signature Sandwich',
    description: 'Cheesy chicken sandwich bursting with tangy olives and fiery jalapeños — a perfect punch of flavour and spice.',
    category_id: 'sandwich-stings', category_name: 'Sandwich Stings',
    price: 290, variant_prices: { 'serve-1': 290, 'serve-2': 460 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['new'], discount_percent: 0, rating: 4.5, prep_time_minutes: 14,
  },

  // ── BURGER BUZZ ───────────────────────────
  {
    id: 'bb-001', name: 'Chicken Tandoori Patty Burger',
    description: 'Crispy fried chicken fillet placed in a soft bun with fresh veggies and flavourful sauces.',
    category_id: 'burger-buzz', category_name: 'Burger Buzz',
    price: 260, variant_prices: { 'serve-1': 260, 'serve-2': 420 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.6, prep_time_minutes: 15,
  },
  {
    id: 'bb-002', name: 'Veg Aloo Patty Burger',
    description: 'Crispy potato patty with Indian spices, fresh veggies and sauces in a soft bun.',
    category_id: 'burger-buzz', category_name: 'Burger Buzz',
    price: 170, variant_prices: { 'serve-1': 170, 'serve-2': 290 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.1, prep_time_minutes: 12,
  },
  {
    id: 'bb-003', name: 'Paneer Club Burger',
    description: 'Chunky paneer patty with Indian spices, crisp veggies and creamy sauces in a fluffy bun.',
    category_id: 'burger-buzz', category_name: 'Burger Buzz',
    price: 210, variant_prices: { 'serve-1': 210, 'serve-2': 360 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['new'], discount_percent: 0, rating: 4.3, prep_time_minutes: 14,
  },
  {
    id: 'bb-004', name: 'Mutton Signature Burger',
    description: 'Juicy mutton patty grilled to perfection, layered with fresh veggies and bold signature sauces in a soft bun.',
    category_id: 'burger-buzz', category_name: 'Burger Buzz',
    price: 360, variant_prices: { 'serve-1': 360, 'serve-2': 640 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 20,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.7, prep_time_minutes: 18,
  },

  // ── PIZZA HIVE ────────────────────────────
  {
    id: 'ph-001', name: 'Chicken Tandoori Pizza',
    description: 'Pizza topped with spicy tandoori chicken chunks, onions, capsicum and mozzarella.',
    category_id: 'pizza-hive', category_name: 'Pizza Hive',
    price: 320, variant_prices: { 'serve-1': 320, 'serve-2': 550 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.5, prep_time_minutes: 20,
  },
  {
    id: 'ph-002', name: 'Chicken Peri-Peri Pizza',
    description: 'Spicy peri-peri marinated chicken loaded with cheese, onions and peppers.',
    category_id: 'pizza-hive', category_name: 'Pizza Hive',
    price: 330, variant_prices: { 'serve-1': 330, 'serve-2': 560 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 20,
    is_veg: false, is_drink: false,
    spicy_levels: ['hot', 'extra-hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['new'], discount_percent: 0, rating: 4.6, prep_time_minutes: 22,
  },
  {
    id: 'ph-003', name: 'Veggies Pizza',
    description: 'Pizzeria delight with fresh peppers, onions, tomatoes, capsicum and gooey mozzarella, baked in Electric Tandoor.',
    category_id: 'pizza-hive', category_name: 'Pizza Hive',
    price: 340, variant_prices: { 'serve-1': 340, 'serve-2': 580 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 25,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 22,
  },
  {
    id: 'ph-004', name: 'Margherita Pizza',
    description: 'Bottom crust pizza topped with rich tomato sauce and gooey mozzarella for a timeless favourite.',
    category_id: 'pizza-hive', category_name: 'Pizza Hive',
    price: 370, variant_prices: { 'serve-1': 370, 'serve-2': 630 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 25,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 20,
  },

  // ── ROLLS & ROARS ─────────────────────────
  {
    id: 'rr-001', name: 'Chicken Tandoori Roll',
    description: 'Soft roll stuffed with smoky tandoori chicken and crunchy onions.',
    category_id: 'rolls-roars', category_name: 'Rolls & Roars',
    price: 240, variant_prices: { 'serve-1': 240, 'serve-2': 420 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 35,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild', 'medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.5, prep_time_minutes: 12,
  },
  {
    id: 'rr-002', name: 'Chicken Peri-Peri Roll',
    description: 'Fiery peri-peri chicken wrapped with lettuce, onions and sauces.',
    category_id: 'rolls-roars', category_name: 'Rolls & Roars',
    price: 250, variant_prices: { 'serve-1': 250, 'serve-2': 400 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['hot', 'extra-hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 12,
  },
  {
    id: 'rr-003', name: 'Chicken Keema Roll',
    description: 'Minced chicken keema cooked in spices, rolled in a soft paratha.',
    category_id: 'rolls-roars', category_name: 'Rolls & Roars',
    price: 260, variant_prices: { 'serve-1': 260, 'serve-2': 420 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 14,
  },
  {
    id: 'rr-004', name: 'Chicken Seekh Kabab Roll',
    description: 'Juicy chicken seekh kababs rolled with onions and chutney.',
    category_id: 'rolls-roars', category_name: 'Rolls & Roars',
    price: 290, variant_prices: { 'serve-1': 290, 'serve-2': 500 },
    image_url: 'assets/chicken-shawarma.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.6, prep_time_minutes: 15,
  },
  {
    id: 'rr-005', name: 'Mutton Seekh Kabab Roll',
    description: 'Spicy mutton seekh kababs wrapped in a paratha with sauce.',
    category_id: 'rolls-roars', category_name: 'Rolls & Roars',
    price: 390, variant_prices: { 'serve-1': 390, 'serve-2': 660 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 20,
    is_veg: false, is_drink: false,
    spicy_levels: ['hot', 'extra-hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.5, prep_time_minutes: 18,
  },
  {
    id: 'rr-006', name: 'Veg Roll',
    description: 'Grilled cheesy sandwich with crunchy veggies and peppery seasoning.',
    category_id: 'rolls-roars', category_name: 'Rolls & Roars',
    price: 180, variant_prices: { 'serve-1': 180, 'serve-2': 290 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 35,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['offer'], discount_percent: 10, rating: 4.1, prep_time_minutes: 10,
  },

  // ── NOODY NOODLES ─────────────────────────
  {
    id: 'nn-001', name: 'Chicken Hakka Noodles',
    description: 'Street-style hakka noodles tossed with chicken, veggies and sauces.',
    category_id: 'noody-noodles', category_name: 'Noody Noodles',
    price: 260, variant_prices: { 'serve-1': 260, 'serve-2': 420 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: false, is_drink: false,
    spicy_levels: ['mild', 'medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 15,
  },
  {
    id: 'nn-002', name: 'Chicken Schezwan Fried Noodles',
    description: 'Spicy schezwan noodles stir-fried with chicken and crunchy veggies.',
    category_id: 'noody-noodles', category_name: 'Noody Noodles',
    price: 280, variant_prices: { 'serve-1': 280, 'serve-2': 450 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 25,
    is_veg: false, is_drink: false,
    spicy_levels: ['hot', 'extra-hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['bestseller'], discount_percent: 0, rating: 4.5, prep_time_minutes: 16,
  },
  {
    id: 'nn-003', name: 'Veg Hakka Noodles',
    description: 'Classic hakka noodles stir-fried with mixed seasonal veggies.',
    category_id: 'noody-noodles', category_name: 'Noody Noodles',
    price: 200, variant_prices: { 'serve-1': 200, 'serve-2': 320 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 35,
    is_veg: true, is_drink: false,
    spicy_levels: ['mild', 'medium'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: [], discount_percent: 0, rating: 4.1, prep_time_minutes: 14,
  },
  {
    id: 'nn-004', name: 'Veg Schezwan Fried Noodles',
    description: 'Spicy noodles with hot schezwan flavour and crunchy veggies.',
    category_id: 'noody-noodles', category_name: 'Noody Noodles',
    price: 220, variant_prices: { 'serve-1': 220, 'serve-2': 350 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: false,
    spicy_levels: ['hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['offer'], discount_percent: 10, rating: 4.2, prep_time_minutes: 14,
  },

  // ── TAKKA TAK TIKKAS ──────────────────────
  {
    id: 'tt-001', name: 'Paneer Seekh Tikka (9 pcs)',
    description: 'Spiced paneer seekh grilled in tandoor — 9 pieces of pure bliss.',
    category_id: 'takka-tak-tikkas', category_name: 'Takka Tak Tikkas',
    price: 530,
    image_url: 'assets/paneer-butter-masala.jpg', is_available: true, stock_count: 20,
    is_veg: true, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: [], size_options: [],
    tags: ['chefs-special'], discount_percent: 0, rating: 4.6, prep_time_minutes: 20,
  },
  {
    id: 'tt-002', name: 'Chicken Seekh Tikka (9 pcs)',
    description: 'Juicy chicken seekh tikka grilled in tandoor — 9 pieces.',
    category_id: 'takka-tak-tikkas', category_name: 'Takka Tak Tikkas',
    price: 790,
    image_url: 'assets/chik.webp', is_available: true, stock_count: 15,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot', 'extra-hot'], serve_options: [], size_options: [],
    tags: ['bestseller', 'chefs-special'], discount_percent: 0, rating: 4.8, prep_time_minutes: 25,
  },
  {
    id: 'tt-003', name: 'Mixed Signature Tikka',
    description: 'A sizzling medley of chicken, paneer and veggies — marinated in Belly Bee\'s secret blend and char-grilled to golden glory.',
    category_id: 'takka-tak-tikkas', category_name: 'Takka Tak Tikkas',
    price: 420, variant_prices: { 'serve-1': 420, 'serve-2': 640 },
    image_url: 'assets/chik.webp', is_available: true, stock_count: 15,
    is_veg: false, is_drink: false,
    spicy_levels: ['medium', 'hot'], serve_options: ['serve-1', 'serve-2'], size_options: [],
    tags: ['chefs-special', 'bestseller'], discount_percent: 0, rating: 4.9, prep_time_minutes: 25,
  },

  // ── BUZZED WITHOUT BOOZE (DRINKS) ─────────
  {
    id: 'bwb-001', name: 'Lemon Bee Zing',
    description: 'Zesty lemon and honey twist that refreshes faster than a summer breeze.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 149, variant_prices: { '250ml': 149, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 50,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: ['bestseller'], discount_percent: 0, rating: 4.5, prep_time_minutes: 5,
  },
  {
    id: 'bwb-002', name: 'Honey Buzz Mojito',
    description: 'Mint, honey and lime unite for a bubbly hive-fresh buzz.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 169, variant_prices: { '250ml': 169, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 50,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: [], discount_percent: 0, rating: 4.4, prep_time_minutes: 5,
  },
  {
    id: 'bwb-003', name: 'Tropical Hive Cooler',
    description: 'Tropical sweetness meets honey splash for a fruity, golden buzz.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 189, variant_prices: { '250ml': 189, '500ml': 310 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: ['new'], discount_percent: 0, rating: 4.5, prep_time_minutes: 5,
  },
  {
    id: 'bwb-004', name: 'Berry Bee Bliss',
    description: 'Berries burst with tangy honey joy in every fizzy sip.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 179, variant_prices: { '250ml': 179, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 5,
  },
  {
    id: 'bwb-005', name: 'Citrus Cloud Fizz',
    description: 'Cloudy citrus delight with honey sparkle and bubbly cheer.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 169, variant_prices: { '250ml': 169, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 5,
  },
  {
    id: 'bwb-006', name: 'Minty Melon Mist',
    description: 'Juicy melon magic and mint twist for the chillest hive sip.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 179, variant_prices: { '250ml': 179, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 5,
  },
  {
    id: 'bwb-007', name: "Bee's Blue Lagoon",
    description: 'Cool electric blue waves kissed by lemon and hive sweetness.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 189, variant_prices: { '250ml': 189, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 35,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: ['new'], discount_percent: 0, rating: 4.4, prep_time_minutes: 5,
  },
  {
    id: 'bwb-008', name: 'Ginger Hive Spark',
    description: 'Spicy ginger meets mellow honey for a zingy hive spark.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 159, variant_prices: { '250ml': 159, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: [], discount_percent: 0, rating: 4.2, prep_time_minutes: 5,
  },
  {
    id: 'bwb-009', name: 'Caramel Cold Buzz',
    description: 'Smooth coffee, rich caramel and honey swirl into pure buzz bliss.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 219, variant_prices: { '250ml': 219, '500ml': 310 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 35,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: ['bestseller'], discount_percent: 0, rating: 4.6, prep_time_minutes: 5,
  },
  {
    id: 'bwb-010', name: 'Peach Bee Spritz',
    description: 'Peachy fizz with honey lift — sparkling sweetness from the hive.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 169, variant_prices: { '250ml': 169, '500ml': 280 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 40,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: [], discount_percent: 0, rating: 4.3, prep_time_minutes: 5,
  },
  {
    id: 'bwb-011', name: 'Power Hive Fuel',
    description: 'Lemon-honey power blend with creatine that recharges your buzz before the next hustle.',
    category_id: 'buzzed-without-booze', category_name: 'Buzzed Without Booze',
    price: 229, variant_prices: { '250ml': 229, '500ml': 310 },
    image_url: 'assets/bellyBeeLogo.webp', is_available: true, stock_count: 30,
    is_veg: true, is_drink: true,
    spicy_levels: [], serve_options: [], size_options: ['250ml', '500ml'],
    tags: ['new'], discount_percent: 0, rating: 4.4, prep_time_minutes: 5,
  },
];

// ─────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────
const COUPONS: CouponCode[] = [
  {
    code: 'FLAT50',
    discount_type: 'flat',
    discount_value: 50,
    min_order_value: 399,
    description: '₹50 off on orders above ₹399',
    valid_till: '2026-12-31',
    is_active: true,
  },
  {
    code: 'BB10',
    discount_type: 'percent',
    discount_value: 10,
    min_order_value: 199,
    max_discount: 80,
    description: '10% off (up to ₹80) on orders above ₹199',
    valid_till: '2026-12-31',
    is_active: true,
  },
  {
    code: 'FIRST100',
    discount_type: 'flat',
    discount_value: 100,
    min_order_value: 499,
    description: '₹100 off your first order above ₹499',
    valid_till: '2026-12-31',
    is_active: true,
  },
  {
    code: 'BUZZFREE',
    discount_type: 'flat',
    discount_value: 35,
    min_order_value: 299,
    description: 'Free delivery — ₹35 off on orders above ₹299',
    valid_till: '2026-12-31',
    is_active: true,
  },
];

// ─────────────────────────────────────────────
// MOCK USER + ADDRESSES
// ─────────────────────────────────────────────
const MOCK_USER: User = {
  id: 'mock-user-001',
  name: 'Anand',
  mobile: '9999999999',
  email: 'anand@bellybee.in',
  preferred_theme: 'light',
  addresses: [
    {
      id: 'addr-001',
      label: 'Home',
      full_address: '12, Shree Nagar Colony, Delhi - 110034',
      landmark: 'Near Metro Station',
      lat: 28.6139,
      lng: 77.2090,
      pincode: '110034',
      is_default: true,
    },
    {
      id: 'addr-002',
      label: 'Work',
      full_address: 'Connaught Place, New Delhi - 110001',
      landmark: 'Inner Circle',
      lat: 28.6315,
      lng: 77.2167,
      pincode: '110001',
      is_default: false,
    },
  ],
};

// ─────────────────────────────────────────────
// MOCK ORDERS
// ─────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  {
    order_id: 'ord-001',
    order_number: 'BB-2026-00101',
    user_id: 'mock-user-001',
    items: [
      { menu_item_id: 'dlb-012', name: 'Chicken Biryani', image_url: 'assets/chicken-biryani.jpg', quantity: 2, unit_price: 320, selected_size: 'half', line_total: 900 },
      { menu_item_id: 'dlb-005', name: 'Paneer Butter Masala', image_url: 'assets/paneer-butter-masala.jpg', quantity: 1, unit_price: 320, selected_size: 'quarter', line_total: 288 },
    ],
    status: 'delivered',
    payment_method: 'razorpay',
    payment_status: 'paid',
    payment_id: 'pay_mock001',
    delivery_address: MOCK_USER.addresses[0],
    subtotal: 1188,
    discount: 0,
    coupon_code: 'FLAT50',
    coupon_discount: 50,
    delivery_fee: 0,
    gst: 57,
    total: 1195,
    placed_at: '2026-04-10T13:30:00.000Z',
    estimated_delivery: '2026-04-10T14:15:00.000Z',
    source: 'web',
  },
];

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MockDataService {

  // ── Catalog ──
  getCategories(): Observable<Category[]> {
    return of([...CATEGORIES]);
  }

  getMenuItems(categoryId?: string): Observable<MenuItem[]> {
    const items = categoryId
      ? ITEMS.filter(i => i.category_id === categoryId)
      : [...ITEMS];
    return of(items);
  }

  getItemById(id: string): Observable<MenuItem | undefined> {
    return of(ITEMS.find(i => i.id === id));
  }

  searchItems(query: string): Observable<MenuItem[]> {
    const q = query.toLowerCase().trim();
    if (!q) return of([...ITEMS]);
    return of(ITEMS.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category_name.toLowerCase().includes(q)
    ));
  }

  getFeaturedItems(tag: string): Observable<MenuItem[]> {
    return of(ITEMS.filter(i => i.tags.includes(tag as any)));
  }

  // ── Auth ──
  getMockUser(): User {
    return { ...MOCK_USER, addresses: [...MOCK_USER.addresses] };
  }

  // ── Orders ──
  getOrders(): Observable<Order[]> {
    const stored = localStorage.getItem('bb_orders');
    const orders: Order[] = stored ? JSON.parse(stored) : [...MOCK_ORDERS];
    return of(orders);
  }

  getOrderById(id: string): Observable<Order | undefined> {
    const stored = localStorage.getItem('bb_orders');
    const orders: Order[] = stored ? JSON.parse(stored) : [...MOCK_ORDERS];
    return of(orders.find(o => o.order_id === id || o.order_number === id));
  }

  saveOrder(order: Order): void {
    const stored = localStorage.getItem('bb_orders');
    const orders: Order[] = stored ? JSON.parse(stored) : [...MOCK_ORDERS];
    orders.unshift(order);
    localStorage.setItem('bb_orders', JSON.stringify(orders));
  }

  // ── Coupons ──
  getCoupons(): Observable<CouponCode[]> {
    return of([...COUPONS]);
  }

  applyCoupon(code: string, cartTotal: number): Observable<CouponResult> {
    const coupon = COUPONS.find(c => c.code === code.toUpperCase() && c.is_active);
    if (!coupon) {
      return of({ valid: false, discount_amount: 0, message: 'Coupon code not found.' });
    }
    if (cartTotal < coupon.min_order_value) {
      return of({ valid: false, discount_amount: 0, message: `Minimum order ₹${coupon.min_order_value} required.` });
    }
    let discount = coupon.discount_type === 'flat'
      ? coupon.discount_value
      : Math.round(cartTotal * coupon.discount_value / 100);
    if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    return of({ valid: true, coupon, discount_amount: discount, message: `Coupon applied! ₹${discount} off.` });
  }
}
