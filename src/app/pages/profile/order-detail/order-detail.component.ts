import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Order, OrderTrackingInfo, OrderItem,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
} from '../../../models/order.model';
import { MenuItem } from '../../../models/menu-item.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl:    './order-detail.component.css',
})
export class OrderDetailComponent implements OnInit {
  @Input() id!: string;

  private orderSvc = inject(OrderService);
  private cartSvc  = inject(CartService);
  private toast    = inject(ToastService);

  order    = signal<Order | null>(null);
  tracking = signal<OrderTrackingInfo | null>(null);
  loading  = signal(true);
  notFound = signal(false);

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  ngOnInit(): void {
    this.orderSvc.getOrderById(this.id).subscribe(order => {
      if (!order) { this.notFound.set(true); this.loading.set(false); return; }
      this.order.set(order);
      this.loading.set(false);
    });

    this.orderSvc.getTrackingInfo(this.id).subscribe(info => {
      this.tracking.set(info);
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatEta(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  reorder(): void {
    const o = this.order();
    if (!o) return;
    this.cartSvc.clear();
    o.items.forEach((oi: OrderItem) => {
      const stub = {
        id: oi.menu_item_id,
        name: oi.name,
        image_url: oi.image_url,
        is_veg: false,
        category_id: '',
        price: oi.unit_price,
        is_available: true,
        rating: 0,
        review_count: 0,
      } as unknown as MenuItem;

      this.cartSvc.addItem(stub, {
        serve: oi.selected_serve,
        size:  oi.selected_size,
        spicy_level: oi.selected_spicy_level,
        special_instructions: oi.special_instructions,
        quantity: oi.quantity,
      });
    });
    this.toast.success('Items added to cart!');
  }
}
