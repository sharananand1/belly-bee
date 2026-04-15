import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, SpicyLevel, ServeOption, SizeOption, AnyVariant, resolvePrice } from '../../../models/menu-item.model';
import { CartOptions } from '../../../models/cart.model';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { VegBadgeComponent } from '../veg-badge/veg-badge.component';

@Component({
  selector: 'bb-customization-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, VegBadgeComponent],
  templateUrl: './customization-sheet.component.html',
  styleUrl: './customization-sheet.component.css',
})
export class CustomizationSheetComponent implements OnChanges {
  @Input() item: MenuItem | null = null;
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() added = new EventEmitter<void>();

  private cart  = inject(CartService);
  private toast = inject(ToastService);

  selectedSpicy?: SpicyLevel;
  selectedServe?: ServeOption;
  selectedSize?: SizeOption;
  quantity = 1;

  readonly spicyLabels: Record<SpicyLevel, string> = {
    mild: 'Mild 🌶',
    medium: 'Medium 🌶🌶',
    hot: 'Hot 🌶🌶🌶',
    'extra-hot': 'Extra Hot 🌶🌶🌶🌶',
  };

  readonly serveLabels: Record<ServeOption, string> = {
    'serve-1': 'Serve 1',
    'serve-2': 'Serve 2',
  };

  readonly sizeLabels: Record<SizeOption, string> = {
    quarter: 'Quarter',
    half: 'Half',
    full: 'Full',
    '250ml': '250 ml',
    '500ml': '500 ml',
    '750ml': '750 ml',
  };

  ngOnChanges(): void {
    if (this.open && this.item) {
      this.selectedSpicy = this.item.spicy_levels[0];
      this.selectedServe = this.item.serve_options[0];
      this.selectedSize  = this.item.size_options[0];
      this.quantity = 1;
    }
  }

  get activeVariant(): AnyVariant | undefined {
    return this.selectedServe ?? this.selectedSize;
  }

  get currentPrice(): number {
    if (!this.item) return 0;
    return resolvePrice(this.item, this.activeVariant);
  }

  get lineTotal(): number {
    return this.currentPrice * this.quantity;
  }

  incrementQty(): void { this.quantity++; }
  decrementQty(): void { if (this.quantity > 1) this.quantity--; }

  addToCart(): void {
    if (!this.item) return;
    const opts: CartOptions = {
      spicy_level: this.selectedSpicy,
      serve: this.selectedServe,
      size: this.selectedSize,
      quantity: this.quantity,
    };
    this.cart.addItem(this.item, opts);
    this.toast.success(`${this.item.name} added to cart`);
    this.added.emit();
    this.close();
  }

  close(): void {
    this.openChange.emit(false);
  }
}
