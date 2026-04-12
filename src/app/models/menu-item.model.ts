export type SpicyLevel = 'mild' | 'medium' | 'hot' | 'extra-hot';
export type ServeOption = 'serve-1' | 'serve-2';
export type SizeOption = 'quarter' | 'half' | 'full' | '250ml' | '500ml' | '750ml';
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
