export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface Address {
  id?: string;
  label: AddressLabel;
  full_address: string;
  landmark?: string;
  lat: number;
  lng: number;
  pincode: string;
  is_default?: boolean;
}
