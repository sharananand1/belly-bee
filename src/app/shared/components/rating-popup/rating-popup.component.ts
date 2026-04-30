import {
  Component, inject, signal, Input, Output, EventEmitter, OnInit, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService, RatingMessage } from '../../../core/services/rating.service';

type Step = 'stars' | 'chips' | 'details' | 'thanks';

const FALLBACK_MESSAGES: Record<number, RatingMessage[]> = {
  1: [
    { id:'f1', message:'Food quality was disappointing', category:'food_quality' },
    { id:'f2', message:'Delivery took too long', category:'delivery' },
    { id:'f3', message:'Packaging was damaged', category:'packaging' },
    { id:'f4', message:'Wrong items delivered', category:'delivery' },
    { id:'f5', message:'Food arrived cold', category:'food_quality' },
    { id:'f6', message:'Not worth the price', category:'value' },
  ],
  2: [
    { id:'f1', message:'Expected better taste', category:'food_quality' },
    { id:'f2', message:'Delivery was a bit late', category:'delivery' },
    { id:'f3', message:'Packaging could be better', category:'packaging' },
    { id:'f4', message:'Portion was small', category:'food_quality' },
    { id:'f5', message:'Below expectations', category:'general' },
    { id:'f6', message:'Average experience', category:'general' },
  ],
  3: [
    { id:'f1', message:'Food was decent', category:'food_quality' },
    { id:'f2', message:'Delivery was on time', category:'delivery' },
    { id:'f3', message:'Average experience overall', category:'general' },
    { id:'f4', message:'Taste was okay', category:'food_quality' },
    { id:'f5', message:'Meets basic expectations', category:'general' },
    { id:'f6', message:'Would consider ordering again', category:'general' },
  ],
  4: [
    { id:'f1', message:'Really enjoyed the food!', category:'food_quality' },
    { id:'f2', message:'Delivery was fast!', category:'delivery' },
    { id:'f3', message:'Great packaging', category:'packaging' },
    { id:'f4', message:'Very tasty!', category:'food_quality' },
    { id:'f5', message:'Will order again!', category:'general' },
    { id:'f6', message:'Great value for money', category:'value' },
  ],
  5: [
    { id:'f1', message:'Absolutely delicious!', category:'food_quality' },
    { id:'f2', message:'Super fast delivery!', category:'delivery' },
    { id:'f3', message:'Packaging was fantastic!', category:'packaging' },
    { id:'f4', message:'Best food ever!', category:'food_quality' },
    { id:'f5', message:'Love Belly Bee!', category:'general' },
    { id:'f6', message:'Perfect experience!', category:'general' },
  ],
};

@Component({
  selector: 'app-rating-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-popup.component.html',
  styleUrl: './rating-popup.component.css',
})
export class RatingPopupComponent implements OnInit {
  @Input() orderId!: string;
  @Output() submitted = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  private ratingSvc = inject(RatingService);

  step            = signal<Step>('stars');
  selectedStars   = signal(0);
  hoverStars      = signal(0);
  messages        = signal<RatingMessage[]>([]);
  selectedMsgIds  = signal<Set<string>>(new Set());
  freeText        = signal('');
  foodStars       = signal(0);
  packagingStars  = signal(0);
  deliveryStars   = signal(0);
  wouldOrder      = signal<boolean | null>(null);
  submitting      = signal(false);
  loadingMsgs     = signal(false);

  readonly stars = [1, 2, 3, 4, 5];

  readonly starLabels: Record<number, string> = {
    1: 'Very Bad 😞', 2: 'Poor 😕', 3: 'Okay 😐', 4: 'Good 😊', 5: 'Excellent 🤩',
  };

  get displayStars(): number { return this.hoverStars() || this.selectedStars(); }

  ngOnInit(): void {}

  selectStar(n: number): void {
    this.selectedStars.set(n);
    this.loadingMsgs.set(true);
    this.ratingSvc.getMessages(n).subscribe({
      next: (msgs) => {
        this.messages.set(msgs.length ? msgs : (FALLBACK_MESSAGES[n] ?? []));
        this.loadingMsgs.set(false);
        this.step.set('chips');
      },
      error: () => {
        this.messages.set(FALLBACK_MESSAGES[n] ?? []);
        this.loadingMsgs.set(false);
        this.step.set('chips');
      },
    });
  }

  toggleMsg(id: string): void {
    const s = new Set(this.selectedMsgIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedMsgIds.set(s);
  }

  isMsgSelected(id: string): boolean { return this.selectedMsgIds().has(id); }

  setFoodStar(n: number): void  { this.foodStars.set(n); }
  setPackStar(n: number): void  { this.packagingStars.set(n); }
  setDeliStar(n: number): void  { this.deliveryStars.set(n); }

  goToDetails(): void { this.step.set('details'); }
  goBack(): void      { this.step.set(this.step() === 'details' ? 'chips' : 'stars'); }

  submit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    const payload: any = {
      orderId: this.orderId,
      overallStars: this.selectedStars(),
      selectedMessageIds: [...this.selectedMsgIds()],
    };
    if (this.foodStars() > 0)      payload.foodQualityStars  = this.foodStars();
    if (this.packagingStars() > 0) payload.packagingStars    = this.packagingStars();
    if (this.deliveryStars() > 0)  payload.deliveryTimeStars = this.deliveryStars();
    if (this.wouldOrder() !== null) payload.wouldOrderAgain  = this.wouldOrder();
    if (this.freeText().trim())     payload.freeText          = this.freeText().trim();

    this.ratingSvc.submitRating(payload).subscribe({
      next: () => {
        this.ratingSvc.clearPending(this.orderId);
        this.submitting.set(false);
        this.step.set('thanks');
        setTimeout(() => this.submitted.emit(), 2500);
      },
      error: () => {
        this.submitting.set(false);
        this.step.set('thanks');
        setTimeout(() => this.submitted.emit(), 2000);
      },
    });
  }

  dismiss(): void {
    this.ratingSvc.markShown(this.orderId);
    this.dismissed.emit();
  }
}
