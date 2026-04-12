import { MenuItem, SpicyLevel, ServeOption, SizeOption } from './menu-item.model';

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  selected_spicy_level?: SpicyLevel;
  selected_serve?: ServeOption;
  selected_size?: SizeOption;
  special_instructions?: string;
  item_total: number;
}

export interface CartOptions {
  spicy_level?: SpicyLevel;
  serve?: ServeOption;
  size?: SizeOption;
  special_instructions?: string;
  quantity?: number;
}
