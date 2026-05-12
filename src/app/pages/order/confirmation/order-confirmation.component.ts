import { Component, inject, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { RatingService } from '../../../core/services/rating.service';
import { Order, OrderTrackingInfo, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';

const POLL_INTERVAL_MS = 15_000;
const TERMINAL_STATUSES = new Set(['delivered', 'cancelled']);
const AUTO_CANCEL_MS = 10 * 60 * 1000; // 10 minutes

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

  order       = signal<Order | null>(null);
  tracking    = signal<OrderTrackingInfo | null>(null);
  loading     = signal(true);
  notFound    = signal(false);
  countdown   = signal('10:00');
  countdownPct = signal(100);

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  private _pollTimer:      ReturnType<typeof setInterval> | null = null;
  private _countdownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this._loadOrder();
    this._loadTracking();
  }

  ngOnDestroy(): void {
    this._stopPoll();
    this._stopCountdown();
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
      if (order.status === 'pending' && order.placed_at) {
        this._startCountdown(order.placed_at);
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
        const prev = this.order()?.status;
        this.order.set(order);
        this._handleStatusChange(order.status);
        this.orderSvc.getTrackingInfo(this.id).subscribe(info => this.tracking.set(info));
        if (TERMINAL_STATUSES.has(order.status)) this._stopPoll();
        // Stop countdown once order leaves pending state
        if (prev === 'pending' && order.status !== 'pending') this._stopCountdown();
      });
    }, POLL_INTERVAL_MS);
  }

  private _stopPoll(): void {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  private _startCountdown(placedAt: string): void {
    if (this._countdownTimer) return;
    const deadline = new Date(placedAt).getTime() + AUTO_CANCEL_MS;
    const tick = () => {
      const remaining = Math.max(0, deadline - Date.now());
      const mins = Math.floor(remaining / 60_000);
      const secs = Math.floor((remaining % 60_000) / 1000);
      this.countdown.set(`${mins}:${secs.toString().padStart(2, '0')}`);
      this.countdownPct.set(Math.round((remaining / AUTO_CANCEL_MS) * 100));
      if (remaining === 0) this._stopCountdown();
    };
    tick();
    this._countdownTimer = setInterval(tick, 1000);
  }

  private _stopCountdown(): void {
    if (this._countdownTimer) { clearInterval(this._countdownTimer); this._countdownTimer = null; }
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
