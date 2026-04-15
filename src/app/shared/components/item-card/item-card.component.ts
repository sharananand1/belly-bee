import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuItem, resolvePrice } from '../../../models/menu-item.model';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { VegBadgeComponent } from '../veg-badge/veg-badge.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { PriceDisplayComponent } from '../price-display/price-display.component';

@Component({
  selector: 'bb-item-card',
  standalone: true,
  imports: [CommonModule, RouterLink, VegBadgeComponent, RatingStarsComponent, PriceDisplayComponent],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.css',
})
export class ItemCardComponent {
  @Input({ required: true }) item!: MenuItem;
  /** Emitted when the user taps the card (for navigation from a parent). */
  @Output() cardClick = new EventEmitter<MenuItem>();

  private cart  = inject(CartService);
  private toast = inject(ToastService);

  get price(): number { return resolvePrice(this.item); }

  get tagLabel(): string | null {
    if (this.item.tags.includes('bestseller')) return 'Bestseller';
    if (this.item.tags.includes('chefs-special')) return "Chef's Special";
    if (this.item.tags.includes('new'))    return 'New';
    if (this.item.tags.includes('offer'))  return 'Offer';
    return null;
  }

  get hasVariants(): boolean {
    return this.item.serve_options.length > 0 || this.item.size_options.length > 0;
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.hasVariants) {
      // Navigate to item detail for variant selection
      this.cardClick.emit(this.item);
      return;
    }
    this.cart.addItem(this.item);
    this.toast.success(`${this.item.name} added to cart`);
  }

  onCardClick(): void {
    this.cardClick.emit(this.item);
  }

  onImgError(img: HTMLImageElement): void {
    img.src = 'assets/bellyBeeLogo.webp';
  }
}
