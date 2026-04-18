import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AddressService } from '../../../core/services/address.service';
import { LocationService } from '../../../core/services/location.service';
import { CartService } from '../../../core/services/cart.service';
import { CheckoutStateService } from '../../../core/services/checkout-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { Address, AddressLabel } from '../../../models/address.model';

/** Kitchen location (Chhatarpur, New Delhi) */
const KITCHEN_LAT = 28.503;
const KITCHEN_LNG = 77.1827;

/** Haversine distance between two lat/lng points, result in km. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-address.component.html',
  styleUrl:    './checkout-address.component.css',
})
export class CheckoutAddressComponent implements OnInit {
  private addressSvc  = inject(AddressService);
  private locationSvc = inject(LocationService);
  private cartSvc     = inject(CartService);
  private checkoutSvc = inject(CheckoutStateService);
  private toast       = inject(ToastService);
  private configSvc   = inject(AppConfigService);
  private router      = inject(Router);

  savedAddresses  = signal<Address[]>([]);
  selectedAddress = signal<Address | null>(null);
  showForm        = signal(false);
  locating        = signal(false);
  saving          = signal(false);

  // New address form model
  form: Omit<Address, 'id'> = {
    label: 'Home',
    full_address: '',
    landmark: '',
    lat: 0,
    lng: 0,
    pincode: '',
    is_default: false,
  };

  readonly labels: AddressLabel[] = ['Home', 'Work', 'Other'];
  readonly labelIcons: Record<AddressLabel, string> = {
    Home: '🏠', Work: '🏢', Other: '📍',
  };

  get config() { return this.configSvc.config; }
  get zomatoUrl() { return this.config.zomato_url; }

  ngOnInit(): void {
    if (this.cartSvc.isEmpty) {
      this.router.navigate(['/cart']);
      return;
    }

    this.addressSvc.getSavedAddresses().subscribe(addrs => {
      this.savedAddresses.set(addrs);
      const def = addrs.find(a => a.is_default) ?? addrs[0] ?? null;
      this.selectedAddress.set(def);
    });
  }

  selectAddress(addr: Address): void {
    this.selectedAddress.set(addr);
    this.showForm.set(false);
  }

  useCurrentLocation(): void {
    this.locating.set(true);
    this.locationSvc.detectCurrentAddress().subscribe({
      next: geo => {
        this.form.full_address = geo.display;
        this.form.pincode      = geo.pincode;
        this.form.lat          = geo.latlng.lat;
        this.form.lng          = geo.latlng.lng;
        this.showForm.set(true);
        this.locating.set(false);
        this.toast.info('Location detected. Review and save.');
      },
      error: () => {
        this.locating.set(false);
        this.toast.error('Could not detect location. Enter address manually.');
        this.showForm.set(true);
      },
    });
  }

  saveAddress(): void {
    if (!this.form.full_address.trim() || !this.form.pincode.trim()) {
      this.toast.error('Please fill address and pincode.');
      return;
    }
    this.saving.set(true);
    this.addressSvc.saveAddress(this.form).subscribe({
      next: saved => {
        this.savedAddresses.update(list => [saved, ...list]);
        this.selectedAddress.set(saved);
        this.showForm.set(false);
        this.saving.set(false);
        this.toast.success('Address saved!');
        this._resetForm();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save address.');
      },
    });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this._resetForm();
  }

  proceed(): void {
    const addr = this.selectedAddress();
    if (!addr) { this.toast.error('Please select a delivery address.'); return; }

    // Distance check — skip if lat/lng are zero (mock addresses without coords)
    if (addr.lat !== 0 && addr.lng !== 0) {
      const distKm = haversineKm(KITCHEN_LAT, KITCHEN_LNG, addr.lat, addr.lng);
      const maxKm  = this.config.max_delivery_km;
      if (distKm > maxKm) {
        this.toast.error(
          `We deliver within ${maxKm} km. Your location is ~${distKm.toFixed(1)} km away.`
        );
        return;
      }
    }

    // Config-driven totals (display only — server recalculates)
    const cfg         = this.config;
    const subtotal    = this.cartSvc.subtotal;
    const couponDisc  = this.checkoutSvc.state.coupon_result?.discount_amount ?? 0;
    const afterCoupon = Math.max(0, subtotal - couponDisc);
    const gst         = Math.round(afterCoupon * (cfg.gst_percent / 100) * 100) / 100;
    const deliveryFee = afterCoupon >= cfg.free_delivery_threshold ? 0 : cfg.delivery_fee;
    const total       = afterCoupon + gst + deliveryFee;

    this.checkoutSvc.patch({ delivery_address: addr, subtotal, delivery_fee: deliveryFee, gst, total });
    this.router.navigate(['/checkout/payment']);
  }

  private _resetForm(): void {
    this.form = { label: 'Home', full_address: '', landmark: '', lat: 0, lng: 0, pincode: '', is_default: false };
  }
}
