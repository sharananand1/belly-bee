import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AddressService } from '../../../core/services/address.service';
import { LocationService } from '../../../core/services/location.service';
import { CartService } from '../../../core/services/cart.service';
import { CheckoutStateService } from '../../../core/services/checkout-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { Address, AddressLabel } from '../../../models/address.model';

const DELIVERY_FEE      = 40;
const FREE_DELIVERY_MIN = 499;
const GST_RATE          = 0.05;

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

  ngOnInit(): void {
    // Redirect if cart is empty
    if (this.cartSvc.isEmpty) {
      this.router.navigate(['/cart']);
      return;
    }

    this.addressSvc.getSavedAddresses().subscribe(addrs => {
      this.savedAddresses.set(addrs);
      // Pre-select default address if one exists
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

    const subtotal     = this.cartSvc.subtotal;
    const couponResult = this.checkoutSvc.state.coupon_result ?? null;
    const couponDisc   = couponResult?.discount_amount ?? 0;
    const deliveryFee  = subtotal - couponDisc >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
    const gst          = Math.round((subtotal - couponDisc) * GST_RATE);
    const total        = subtotal - couponDisc + deliveryFee + gst;

    this.checkoutSvc.patch({ delivery_address: addr, subtotal, delivery_fee: deliveryFee, gst, total });
    this.router.navigate(['/checkout/payment']);
  }

  private _resetForm(): void {
    this.form = { label: 'Home', full_address: '', landmark: '', lat: 0, lng: 0, pincode: '', is_default: false };
  }
}
