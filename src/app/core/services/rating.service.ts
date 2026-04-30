import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';

export interface RatingMessage {
  id: string;
  message: string;
  category: string;
}

export interface SubmitRatingPayload {
  orderId: string;
  overallStars: number;
  foodQualityStars?: number;
  packagingStars?: number;
  deliveryTimeStars?: number;
  wouldOrderAgain?: boolean;
  freeText?: string;
  selectedMessageIds?: string[];
}

export interface PublishedRating {
  id: string;
  overallStars: number;
  freeText?: string;
  wouldOrderAgain?: boolean;
  publishedAt: string;
  selectedMessages: string[];
  displayName: string;
}

export interface OrderRating {
  id: string;
  orderId: string;
  overallStars: number;
  foodQualityStars?: number;
  packagingStars?: number;
  deliveryTimeStars?: number;
  wouldOrderAgain?: boolean;
  freeText?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'published';
  adminReply?: string;
  createdAt: string;
}

const PENDING_KEY_PREFIX = 'bb_pending_rating_';
const SHOWN_KEY_PREFIX   = 'bb_rating_shown_';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private api = inject(ApiService);

  // ── Active popup state (singleton) ──────────────────────────────
  pendingOrderId = signal<string | null>(null);

  /** Call after order becomes 'delivered' — marks it as needing a rating */
  markPendingRating(orderId: string): void {
    localStorage.setItem(PENDING_KEY_PREFIX + orderId, '1');
    // Only show popup if not already shown this session
    if (!sessionStorage.getItem(SHOWN_KEY_PREFIX + orderId)) {
      this.pendingOrderId.set(orderId);
    }
  }

  /** Call when popup is shown — prevents re-showing within the same session */
  markShown(orderId: string): void {
    sessionStorage.setItem(SHOWN_KEY_PREFIX + orderId, '1');
    this.pendingOrderId.set(null);
  }

  /** Call after rating is submitted — removes from localStorage */
  clearPending(orderId: string): void {
    localStorage.removeItem(PENDING_KEY_PREFIX + orderId);
    sessionStorage.removeItem(SHOWN_KEY_PREFIX + orderId);
    this.pendingOrderId.set(null);
  }

  /** Check localStorage for any un-rated delivered orders and surface first one */
  checkForPendingRatings(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PENDING_KEY_PREFIX)) {
        const orderId = key.replace(PENDING_KEY_PREFIX, '');
        if (!sessionStorage.getItem(SHOWN_KEY_PREFIX + orderId)) {
          this.pendingOrderId.set(orderId);
          return;
        }
      }
    }
  }

  // ── API calls ────────────────────────────────────────────────────

  getMessages(starRating: number): Observable<RatingMessage[]> {
    if (!environment.production) return of([]);
    return this.api.get<RatingMessage[]>(`ratings/messages/${starRating}`);
  }

  submitRating(payload: SubmitRatingPayload): Observable<OrderRating> {
    return this.api.post<OrderRating>('ratings', payload);
  }

  getRatingForOrder(orderId: string): Observable<OrderRating | null> {
    return this.api.get<OrderRating | null>(`ratings/order/${orderId}`);
  }

  getPublished(limit = 12): Observable<PublishedRating[]> {
    return this.api.get<PublishedRating[]>(`ratings/published?limit=${limit}`);
  }
}
