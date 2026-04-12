import { Address } from './address.model';

export interface User {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  profile_pic?: string;
  addresses: Address[];
  preferred_theme: 'light' | 'dark';
}
