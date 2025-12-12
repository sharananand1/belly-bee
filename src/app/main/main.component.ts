import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  title = 'Belly Bee - Homemade Food';

  // state
  cart: CartItem[] = [];
  menuItems: MenuItem[] = [
    { id:'item-001', name:'Chicken Biryani', description:'Aromatic basmati rice with tender chicken cooked in traditional spices.', price:200, image:'assets/chicken-biryani.jpg', veg:false, discount:10, available:true, rating:4.6, spicy:true },
    { id:'item-002', name:'Paneer Butter Masala', description:'Rich and creamy paneer curry with fresh paneer in a tomato base.', price:180, image:'assets/paneer-butter-masala.jpg', veg:true, discount:15, available:true, rating:4.7, spicy:false },
    { id:'item-003', name:'Veg Pulao', description:'Mixed vegetables in aromatic basmati rice, lightly spiced.', price:120, image:'assets/veg-pulao.jpg', veg:true, available:true, rating:4.2, spicy:false },
    { id:'item-004', name:'Dal Tadka', description:'Yellow lentils tempered with aromatic spices.', price:90, image:'assets/dal-tadka.jpg', veg:true, available:false, rating:4.1, spicy:false },
    { id:'item-005', name:'Butter Chicken', description:'Tender chicken pieces simmered in a rich tomato and butter gravy.', price:250, image:'assets/butter-chicken.webp', veg:false, discount:5, available:true, rating:4.5, spicy:false },
    { id:'item-006', name:'Aloo Gobi', description:'Potatoes and cauliflower florets in a homestyle curry.', price:100, image:'assets/aloo-gobi.jpg', veg:true, available:true, rating:4.0, spicy:false },
    { id:'item-007', name:'Chicken Shawarma', description:'Succulent chicken wrap with fresh veggies and sauces.', price:150, image:'assets/chicken-shawarma.webp', veg:false, available:true, rating:4.3, spicy:true },
    { id:'item-008', name:'Pav Bhaji', description:'Spicy mashed vegetable curry with buttered pav.', price:70, image:'assets/pav-bhaji.jpg', veg:true, available:true, rating:4.4, spicy:true },
    { id:'item-009', name:'Mutton Korma', description:'Tender mutton in a rich, aromatic gravy.', price:300, image:'assets/mutton-korma.jpeg', veg:false, available:true, rating:4.5, spicy:true },
    { id:'item-010', name:'Pineapple Rice', description:'Fragrant rice with sweet and tangy pineapple.', price:130, image:'assets/pineapple-rice.jpg', veg:true, available:true, rating:4.1, spicy:false }
  ];

  filteredMenuItems: MenuItem[] = [];
  isScrolled = false;
  searchTerm = '';

  // filters model
  filters: Filters = { veg: undefined, discounted: false, spicy: false, topRated: false };

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.loadCart();
    this.filteredMenuItems = [...this.menuItems];
    if (isPlatformBrowser(this.platformId)) {
      this.checkScroll();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) this.checkScroll();
  }

  checkScroll(): void {
    this.isScrolled = window.scrollY > 96;
  }

  addToCart(item: MenuItem): void {
    if (!item.available) return;
    const idx = this.cart.findIndex(ci => ci.id === item.id);
    if (idx > -1) this.cart[idx].quantity += 1;
    else this.cart.push({ ...item, quantity: 1 });
    this.saveCart();
  }

  buyNow(item: MenuItem): void {
    if (!item.available) return;
    // add to existing cart instead of replacing it
    const idx = this.cart.findIndex(ci => ci.id === item.id);
    if (idx > -1) this.cart[idx].quantity += 1;
    else this.cart.push({ ...item, quantity: 1 });
    this.saveCart();
    this.router.navigate(['/checkout']);
  }

  goToCheckout(): void {
    this.saveCart();
    this.router.navigate(['/checkout']);
  }
  removeFromCart(id: string): void {
    this.cart = this.cart.filter(ci => ci.id !== id);
    this.saveCart();
  }
  incrementCart(id: string): void {
    const it = this.cart.find(ci => ci.id === id); if (!it) return; it.quantity += 1; this.saveCart();
  }
  decrementCart(id: string): void {
    const it = this.cart.find(ci => ci.id === id); if (!it) return; it.quantity = Math.max(0, it.quantity - 1);
    if (it.quantity === 0) this.removeFromCart(id); else this.saveCart();
  }
  getTotalCartItems(): number { return this.cart.reduce((t, i) => t + i.quantity, 0); }
  calculateCartTotal(): number { return this.cart.reduce((t, i) => t + this.getDiscountedPrice(i.price, i.discount) * i.quantity, 0); }
  getDiscountedPrice(price: number, discount?: number): number { return discount ? Math.round(price - price * discount / 100) : price; }

  saveCart(): void { localStorage.setItem('cart', JSON.stringify(this.cart)); }
  loadCart(): void { this.cart = JSON.parse(localStorage.getItem('cart') || '[]'); }

  // ------- Search with debounce to avoid jitter ---------
  private searchTimer: any;
  onSearchInput(ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.searchTerm = val;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 150);
  }

  // ------- Filters ---------
  toggleFilter<K extends keyof Filters>(key: K, value?: Filters[K]): void {
    if (typeof value === 'boolean') {
      this.filters[key] = this.filters[key] === value ? undefined as any : value; // toggle specific boolean
    } else {
      // toggle simple boolean flags
      // @ts-ignore
      this.filters[key] = !this.filters[key];
    }
    this.applyFilters();
  }
  clearFilters(): void { this.filters = { veg: undefined, discounted: false, spicy: false, topRated: false }; this.applyFilters(); }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const f = this.filters;
    this.filteredMenuItems = this.menuItems.filter(item => {
      if (term && !(item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term))) return false;
      if (typeof f.veg === 'boolean' && item.veg !== f.veg) return false;
      if (f.discounted && !(item.discount && item.discount > 0)) return false;
      if (f.spicy && !item.spicy) return false;
      if (f.topRated && !(item.rating && item.rating >= 4.5)) return false;
      return true;
    });
  }

  // util
  trackById(_: number, item: { id: string }) { return item.id; }
  goToCart(): void { this.router.navigate(['/cart']); }
}

// models
interface MenuItem { id: string; name: string; description: string; price: number; image: string; veg: boolean; discount?: number; available: boolean; rating?: number; spicy?: boolean; }
interface CartItem extends MenuItem { quantity: number; }
interface Filters { veg?: boolean | undefined; discounted: boolean; spicy: boolean; topRated: boolean; }

