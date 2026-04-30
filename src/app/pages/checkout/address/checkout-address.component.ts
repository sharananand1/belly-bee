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

/** Kitchen location — Chhatarpur, New Delhi 110074 */
const KITCHEN_LAT = 28.4952;
const KITCHEN_LNG = 77.1865;

const CALL_US_MIN_KM  = 25;  // beyond this, show "call us" instead of blocking
const MAX_DELIVERY_KM = 40;  // hard limit — orders beyond this are rejected
const BELLY_BEE_PHONE = '+918899888683';

/** Distance-based delivery fee in ₹. Free above the free_delivery_threshold. */
function distanceDeliveryFee(distKm: number): number {
  if (distKm <= 5)  return 20;
  if (distKm <= 10) return 40;
  if (distKm <= 20) return 60;
  return 80; // 20–40 km zone
}

/** Dynamic delivery radius based on order subtotal (₹).
 *  10 km is always the minimum — no order should ever be rejected within 10 km. */
function maxDeliveryKm(subtotalRupees: number): number {
  if (subtotalRupees >= 3000) return MAX_DELIVERY_KM;
  if (subtotalRupees >= 2000) return 20;
  if (subtotalRupees >= 1000) return 15;
  if (subtotalRupees >= 500)  return 12;
  return 10; // Minimum radius — always deliver within 10 km
}

/** Hint shown when order value is too low for the delivery distance. */
function deliveryHint(distKm: number): string {
  if (distKm <= 12)  return 'Add items worth ₹500 or more to deliver to your area.';
  if (distKm <= 15)  return 'Add items worth ₹1,000 or more to deliver to your area.';
  if (distKm <= 20)  return 'Add items worth ₹2,000 or more to deliver to your area.';
  if (distKm <= 25)  return 'Add items worth ₹3,000 or more to deliver to your area.';
  return `Your location is ~${distKm.toFixed(1)} km away. Call us at ${BELLY_BEE_PHONE} to arrange delivery.`;
}

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

  savedAddresses    = signal<Address[]>([]);
  selectedAddress   = signal<Address | null>(null);
  showForm          = signal(false);
  locating          = signal(false);
  saving            = signal(false);
  pincodeNeeded     = signal(false);
  loadingAddresses  = signal(true);

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

    this.addressSvc.getSavedAddresses().subscribe({
      next: addrs => {
        this.savedAddresses.set(addrs);
        const def = addrs.find(a => a.is_default) ?? addrs[0] ?? null;
        this.selectedAddress.set(def);
        this.loadingAddresses.set(false);
      },
      error: () => {
        this.loadingAddresses.set(false);
      },
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

        if (!geo.pincode) {
          this.pincodeNeeded.set(true);
          this.toast.info('Location detected! Please enter your 6-digit pincode.');
          // Auto-focus pincode after form renders
          setTimeout(() => {
            const el = document.getElementById('pincode') as HTMLInputElement | null;
            el?.focus();
          }, 150);
        } else {
          this.pincodeNeeded.set(false);
          this.toast.success('Location detected! Review and save.');
        }
      },
      error: (err) => {
        this.locating.set(false);
        const denied = err?.code === 1; // GeolocationPositionError.PERMISSION_DENIED
        this.toast.error(denied
          ? 'Location permission denied. Please enter address manually.'
          : 'Could not detect location. Enter address manually.');
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

    // Distance check — skip if lat/lng are zero (address without GPS coords)
    if (addr.lat !== 0 && addr.lng !== 0) {
      const distKm = haversineKm(KITCHEN_LAT, KITCHEN_LNG, addr.lat, addr.lng);
      const subtotal = this.cartSvc.subtotal;
      const maxKm = maxDeliveryKm(subtotal);

      if (distKm > MAX_DELIVERY_KM) {
        // Hard block — beyond 40 km
        this.toast.error(
          `We currently deliver up to ${MAX_DELIVERY_KM} km. Your location is ~${distKm.toFixed(1)} km away. Call us at ${BELLY_BEE_PHONE}.`
        );
        return;
      }

      if (distKm > CALL_US_MIN_KM) {
        // 25–40 km zone — prompt to call, but don't block
        this.toast.info(
          `Your location is ~${distKm.toFixed(1)} km from our kitchen. Please call ${BELLY_BEE_PHONE} to confirm delivery before placing the order.`
        );
        // Fall through — allow order to proceed
      } else if (distKm > maxKm) {
        // Within 25 km but below subtotal threshold for this distance
        this.toast.error(
          `Your location is ~${distKm.toFixed(1)} km away. ${deliveryHint(distKm)}`
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

    // Use distance-based fee when GPS coords are known; otherwise fall back to flat config fee
    let deliveryFee = afterCoupon >= cfg.free_delivery_threshold ? 0 : cfg.delivery_fee;
    if (addr.lat !== 0 && addr.lng !== 0 && afterCoupon < cfg.free_delivery_threshold) {
      const distKm = haversineKm(KITCHEN_LAT, KITCHEN_LNG, addr.lat, addr.lng);
      deliveryFee  = distanceDeliveryFee(distKm);
    }

    const total = afterCoupon + gst + deliveryFee;

    this.checkoutSvc.patch({ delivery_address: addr, subtotal, delivery_fee: deliveryFee, gst, total });
    this.router.navigate(['/checkout/payment']);
  }

  private _resetForm(): void {
    this.form = { label: 'Home', full_address: '', landmark: '', lat: 0, lng: 0, pincode: '', is_default: false };
  }
}
