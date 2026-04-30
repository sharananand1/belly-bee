import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { MenuItem, SpicyLevel, ServeOption, SizeOption, AnyVariant, resolvePrice } from '../../models/menu-item.model';
import { CartOptions } from '../../models/cart.model';
import { VegBadgeComponent } from '../../shared/components/veg-badge/veg-badge.component';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, VegBadgeComponent, RatingStarsComponent, SkeletonLoaderComponent],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.css',
})
export class ItemDetailComponent implements OnInit {
  @Input() id!: string;

  private menuSvc   = inject(MenuService);
  private cart      = inject(CartService);
  private toast     = inject(ToastService);
  private analytics = inject(AnalyticsService);
  private router    = inject(Router);
  private titleSvc  = inject(Title);
  private metaSvc   = inject(Meta);

  item       = signal<MenuItem | null>(null);
  loading    = signal(true);
  notFound   = signal(false);
  quantity   = signal(1);

  selectedSpicy        = signal<SpicyLevel | undefined>(undefined);
  selectedServe        = signal<ServeOption | undefined>(undefined);
  selectedSize         = signal<SizeOption | undefined>(undefined);
  specialInstructions  = signal('');

  readonly spicyLabels: Record<SpicyLevel, string> = {
    mild: 'Mild 🌶', medium: 'Medium 🌶🌶', hot: 'Hot 🌶🌶🌶', 'extra-hot': 'Extra Hot 🌶🌶🌶🌶',
  };
  readonly serveLabels: Record<ServeOption, string> = { 'serve-1': 'Serve 1', 'serve-2': 'Serve 2' };
  readonly sizeLabels: Record<SizeOption, string> = {
    quarter: 'Quarter', half: 'Half', full: 'Full', '250ml': '250 ml', '500ml': '500 ml', '750ml': '750 ml',
  };

  ngOnInit(): void {
    this.menuSvc.getItemById(this.id).subscribe(item => {
      if (!item) { this.notFound.set(true); this.loading.set(false); return; }
      this.item.set(item);
      this.selectedSpicy.set(item.spicy_levels[0]);
      this.selectedServe.set(item.serve_options[0]);
      this.selectedSize.set(item.size_options[0]);
      this.loading.set(false);
      this.analytics.menuItemViewed(item.id, item.name);

      // Dynamic title + meta for SEO / social sharing
      const price = item.price ?? 0;
      const veg   = item.is_veg ? 'Veg' : 'Non-Veg';
      this.titleSvc.setTitle(`${item.name} — Belly Bee`);
      this.metaSvc.updateTag({ name: 'description',        content: `Order ${item.name} (${veg}) from Belly Bee cloud kitchen, Chhatarpur. ₹${price}. ${item.description ?? ''}`.slice(0, 160) });
      this.metaSvc.updateTag({ property: 'og:title',       content: `${item.name} — Belly Bee` });
      this.metaSvc.updateTag({ property: 'og:description', content: `${veg} · ₹${price} · ${item.category_name}` });
      if (item.image_url) {
        this.metaSvc.updateTag({ property: 'og:image', content: item.image_url });
      }
    });
  }

  get activeVariant(): AnyVariant | undefined {
    return this.selectedServe() ?? this.selectedSize();
  }

  get currentPrice(): number {
    const it = this.item();
    return it ? resolvePrice(it, this.activeVariant) : 0;
  }

  get lineTotal(): number { return this.currentPrice * this.quantity(); }

  get discountedTotal(): number {
    const it = this.item();
    if (!it || !it.discount_percent) return this.lineTotal;
    return Math.round(this.lineTotal * (1 - it.discount_percent / 100));
  }

  increment(): void { this.quantity.update(q => q + 1); }
  decrement(): void { this.quantity.update(q => Math.max(1, q - 1)); }

  addToCart(): void {
    const it = this.item();
    if (!it) return;
    const opts: CartOptions = {
      spicy_level: this.selectedSpicy(),
      serve: this.selectedServe(),
      size: this.selectedSize(),
      quantity: this.quantity(),
      special_instructions: this.specialInstructions().trim() || undefined,
    };
    this.cart.addItem(it, opts);
    this.analytics.cartAdd(it.id, it.name, this.currentPrice, this.quantity());
    this.toast.success(`${it.name} added to cart!`);
    this.router.navigate(['/cart']);
  }

  goBack(): void { this.router.navigate(['/menu']); }

  onImgError(img: HTMLImageElement): void { img.src = 'assets/bellyBeeLogo.webp'; }
}
