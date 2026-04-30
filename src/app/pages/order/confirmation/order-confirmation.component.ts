import { Component, inject, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { RatingService } from '../../../core/services/rating.service';
import { Order, OrderTrackingInfo, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';

const POLL_INTERVAL_MS = 15_000;
const TERMINAL_STATUSES = new Set(['delivered', 'cancelled']);

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl:    './order-confirmation.component.css',
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  @Input() id!: string;

  private orderSvc  = inject(OrderService);
  private ratingSvc = inject(RatingService);

  order    = signal<Order | null>(null);
  tracking = signal<OrderTrackingInfo | null>(null);
  loading  = signal(true);
  notFound = signal(false);

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this._loadOrder();
    this._loadTracking();
  }

  ngOnDestroy(): void {
    this._stopPoll();
  }

  private _loadOrder(): void {
    this.orderSvc.getOrderById(this.id).subscribe(order => {
      if (!order) { this.notFound.set(true); this.loading.set(false); return; }
      this.order.set(order);
      this.loading.set(false);
      this._handleStatusChange(order.status);
      if (!TERMINAL_STATUSES.has(order.status)) {
        this._startPoll();
      }
    });
  }

  private _loadTracking(): void {
    this.orderSvc.getTrackingInfo(this.id).subscribe(info => this.tracking.set(info));
  }

  private _startPoll(): void {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => {
      this.orderSvc.getOrderById(this.id).subscribe(order => {
        if (!order) return;
        this.order.set(order);
        this._handleStatusChange(order.status);
        this.orderSvc.getTrackingInfo(this.id).subscribe(info => this.tracking.set(info));
        if (TERMINAL_STATUSES.has(order.status)) this._stopPoll();
      });
    }, POLL_INTERVAL_MS);
  }

  private _stopPoll(): void {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  private _handleStatusChange(status: string): void {
    if (status === 'delivered') {
      this.ratingSvc.markPendingRating(this.id);
    }
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
