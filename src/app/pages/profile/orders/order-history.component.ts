import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';
import { MenuItem } from '../../../models/menu-item.model';

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-history.component.html',
  styleUrl:    './order-history.component.css',
})
export class OrderHistoryComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private cartSvc  = inject(CartService);
  private toast    = inject(ToastService);

  orders  = signal<Order[]>([]);
  loading = signal(true);
  filter  = signal<FilterTab>('all');

  readonly filtered = computed(() => {
    const f = this.filter();
    const all = this.orders();
    if (f === 'all')       return all;
    if (f === 'active')    return all.filter(o => ACTIVE_STATUSES.includes(o.status));
    if (f === 'delivered') return all.filter(o => o.status === 'delivered');
    if (f === 'cancelled') return all.filter(o => o.status === 'cancelled');
    return all;
  });

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  ngOnInit(): void {
    this.orderSvc.getOrders().subscribe({
      next: orders => { this.orders.set(orders); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setFilter(f: FilterTab): void { this.filter.set(f); }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  itemSummary(order: Order): string {
    const first = order.items[0]?.name ?? '';
    const extra = order.items.length - 1;
    return extra > 0 ? `${first} +${extra} more` : first;
  }

  reorder(order: Order): void {
    this.cartSvc.clear();
    order.items.forEach(oi => {
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
