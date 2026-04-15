export type SpicyLevel = 'mild' | 'medium' | 'hot' | 'extra-hot';
export type ServeOption = 'serve-1' | 'serve-2';
export type SizeOption = 'quarter' | 'half' | 'full' | '250ml' | '500ml' | '750ml';
export type ItemTag = 'bestseller' | 'new' | 'offer' | 'chefs-special';
export type AnyVariant = ServeOption | SizeOption;

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  /** Base price — always the lowest / default option price */
  price: number;
  /** Per-variant prices. If present, overrides base price for that variant. */
  variant_prices?: Partial<Record<AnyVariant, number>>;
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

/** Resolve the price for a selected variant, falling back to base price */
export function resolvePrice(item: MenuItem, variant?: AnyVariant): number {
  if (variant && item.variant_prices?.[variant] != null) {
    return item.variant_prices[variant]!;
  }
  return item.price;
}
