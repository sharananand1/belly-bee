import { Component, inject, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderTrackingInfo, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl:    './order-confirmation.component.css',
})
export class OrderConfirmationComponent implements OnInit {
  @Input() id!: string;

  private orderSvc = inject(OrderService);

  order    = signal<Order | null>(null);
  tracking = signal<OrderTrackingInfo | null>(null);
  loading  = signal(true);
  notFound = signal(false);

  readonly statusLabels  = ORDER_STATUS_LABELS;
  readonly statusColors  = ORDER_STATUS_COLORS;

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
}
