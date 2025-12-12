import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { firstValueFrom } from 'rxjs';

declare var Razorpay: any; // Razorpay script attaches this

type CartItem = {
  id: string;
  name: string;
  price: number;
  discount?: number;
  quantity: number;
  image?: string;
};

type PaymentKind = 'COD' | 'RAZORPAY' | 'PHONEPE' | 'PAYTM' | 'CARD';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  cart: CartItem[] = [];

  // form fields
  name = '';
  phone = '';
  address = '';
  pincode = '';
  landmark = '';
  deliverySlot = 'ASAP';
  payment: PaymentKind = 'COD';
  promo = '';
  applyingPromo = false;

  // payment config
  private readonly RZP_KEY = 'rzp_test_mgkjzvurwm33Al'; // replace with your live key
  private readonly UPI_VPA = 'bellybee@oksbi'; // your VPA for UPI deep link
  paying = false;

  // location state
  locating = false;
  locationError: string | null = null;
  hasLocation = false;

  @ViewChild('mapEl', { static: false }) mapEl!: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private marker?: L.Marker;

  // explicit icon so Leaflet never looks under /media
  private readonly pinIcon = L.icon({
    iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
    iconUrl: 'assets/leaflet/marker-icon.png',
    shadowUrl: 'assets/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
  }
  ngAfterViewInit(): void {}

  // map
  async useCurrentLocation(): Promise<void> {
    this.locationError = null;
    if (!('geolocation' in navigator)) {
      this.locationError = 'Geolocation not available on this device';
      return;
    }
    this.locating = true;

    const getPosition = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 20000, maximumAge: 0
        });
      });

    try {
      const pos = await getPosition();
      const { latitude, longitude } = pos.coords;
      this.hasLocation = true;
      setTimeout(() => this.ensureMap([latitude, longitude], 17), 0);
      await this.reverseGeocode(latitude, longitude);
    } catch (err: any) {
      if (err?.code === 1) this.locationError = 'Permission denied. Please allow location.';
      else if (err?.code === 2) this.locationError = 'Position unavailable. Try again.';
      else if (err?.code === 3) this.locationError = 'Request timed out. Try again.';
      else this.locationError = 'Could not fetch location.';
    } finally {
      this.locating = false;
    }
  }
  private ensureMap(center: [number, number], zoom = 16) {
    if (!isPlatformBrowser(this.platformId) || !this.mapEl) return;
    if (!this.map) {
      this.map = L.map(this.mapEl.nativeElement, { zoomControl: true }).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(this.map);
      this.marker = L.marker(center, { draggable: true, icon: this.pinIcon }).addTo(this.map);
      this.marker.on('dragend', () => this.onMarkerMove());
      this.map.on('click', (e: L.LeafletMouseEvent) => { this.marker!.setLatLng(e.latlng); this.onMarkerMove(); });
    } else {
      this.map.setView(center, zoom);
      this.marker?.setLatLng(center);
    }
    setTimeout(() => this.map?.invalidateSize(), 0);
  }
  private onMarkerMove() {
    const ll = this.marker!.getLatLng();
    this.reverseGeocode(ll.lat, ll.lng);
  }
  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`;
      const data: any = await firstValueFrom(this.http.get(url, { headers: { 'Accept-Language': 'en-IN' } }));
      const a = data?.address || {};
      const line1 = [[a.house_number, a.road].filter(Boolean).join(' '), a.neighbourhood || a.suburb || a.quarter].filter(Boolean).join(', ');
      const city = a.city || a.town || a.village || a.county;
      const line2 = [city, a.state, a.country].filter(Boolean).join(', ');
      this.address = [line1, line2].filter(Boolean).join('\n');
      this.pincode = a.postcode || this.pincode;
      this.landmark = a.hamlet || a.locality || a.suburb || this.landmark || '';
    } catch {
      this.locationError = 'Could not get address for that pin. Try moving it slightly.';
    }
  }

  // totals with guards
  getDiscountedPrice(p: number, d?: number) { return d ? Math.round(p - (p * d) / 100) : p; }
  get subtotal() { return this.cart.reduce((t, i) => t + this.getDiscountedPrice(i.price, i.discount) * i.quantity, 0); }
  get deliveryFee() { if (!this.cart.length) return 0; return this.subtotal >= 499 ? 0 : 35; }
  get tax() { if (!this.cart.length) return 0; return Math.round(this.subtotal * 0.05); }
  get total() { if (!this.cart.length) return 0; return this.subtotal + this.tax + this.deliveryFee; }

  // promo
  applyPromo(): void {
    if (!this.cart.length) { alert('Add items first'); return; }
    if (!this.promo) return;
    this.applyingPromo = true;
    setTimeout(() => {
      if (this.promo.trim().toUpperCase() === 'FLAT50' && this.subtotal >= 399) {
        alert('Promo applied: ₹50 off at payment');
      } else { alert('Promo not applicable'); }
      this.applyingPromo = false;
    }, 500);
  }

  // payment tiles
  selectPayment(kind: PaymentKind) { this.payment = kind; }

  async payOrPlace(): Promise<void> {
    if (!this.cart.length) return;
    if (!this.name || !this.phone || !this.address || !this.pincode) {
      alert('Please fill name, phone, address and pincode.');
      return;
    }
    if (this.payment === 'COD') { this.finishOrder('COD'); return; }

    this.paying = true;
    try {
      if (this.payment === 'RAZORPAY' || this.payment === 'CARD') {
        await this.payWithRazorpay();
      } else if (this.payment === 'PHONEPE' || this.payment === 'PAYTM') {
        this.payWithUpiDeepLink();
      } else {
        alert('Unsupported method'); // safety
      }
    } finally {
      this.paying = false;
    }
  }

  // Razorpay (handles cards, UPI, wallets)
  private async loadRzp(): Promise<void> {
    if ((window as any).razorpayLoaded) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => { (window as any).razorpayLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(s);
    });
  }
  private async payWithRazorpay(): Promise<void> {
    await this.loadRzp();

    // Optional: create order on your backend and set options.order_id
    // const order = await firstValueFrom(this.http.post<any>('/api/payments/razorpay/create-order', { amount: this.total * 100 }));
    // const orderId = order.id;

    const options = {
      key: this.RZP_KEY,
      amount: this.total * 100, // paise
      currency: 'INR',
      name: 'Belly Bee',
      description: 'Food order',
      // order_id: orderId, // recommended if you have backend
      prefill: {
        name: this.name,
        email: '', // optional
        contact: this.phone
      },
      notes: {
        address: this.address.replace(/\n/g, ', ')
      },
      theme: { color: '#e53935' },
      handler: (resp: any) => {
        // verify on backend in real app
        this.finishOrder('RAZORPAY', resp.razorpay_payment_id);
      },
      modal: { ondismiss: () => {} }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  // UPI deep link for PhonePe/Paytm (mobile)
  private payWithUpiDeepLink(): void {
    const upi = new URL('upi://pay');
    const amount = this.total.toFixed(2);
    upi.searchParams.set('pa', this.UPI_VPA);
    upi.searchParams.set('pn', 'Belly Bee');
    upi.searchParams.set('am', amount);
    upi.searchParams.set('cu', 'INR');
    upi.searchParams.set('tn', 'Order payment');
    // try opening
    window.location.href = upi.toString();
    // fallback info if it returns quickly without payment would need backend. For now finish later on COD if needed.
    setTimeout(() => {
      const ok = confirm('Did the UPI app complete the payment');
      if (ok) this.finishOrder(this.payment);
    }, 4000);
  }

  private finishOrder(method: PaymentKind, ref?: string) {
    const orderId = 'BB' + Math.floor(100000 + Math.random() * 900000);
    localStorage.removeItem('cart');
    alert(`Order placed: ${orderId}\nMethod: ${method}${ref ? '\nRef: ' + ref : ''}\nTotal: ₹${this.total}`);
    history.replaceState(null, '', '/');
    window.location.assign('/main');
  }
}
