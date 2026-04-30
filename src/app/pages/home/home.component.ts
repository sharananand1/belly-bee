import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MenuService } from '../../core/services/menu.service';
import { RatingService, PublishedRating } from '../../core/services/rating.service';
import { Category } from '../../models/category.model';
import { MenuItem } from '../../models/menu-item.model';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { CustomizationSheetComponent } from '../../shared/components/customization-sheet/customization-sheet.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ItemCardComponent, SkeletonLoaderComponent, CustomizationSheetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private menu       = inject(MenuService);
  private ratingSvc  = inject(RatingService);
  private router     = inject(Router);
  private titleSvc   = inject(Title);
  private metaSvc    = inject(Meta);

  categories    = signal<Category[]>([]);
  bestsellers   = signal<MenuItem[]>([]);
  newItems      = signal<MenuItem[]>([]);
  offerItems    = signal<MenuItem[]>([]);
  specials      = signal<MenuItem[]>([]);
  loading       = signal(true);
  reviews       = signal<PublishedRating[]>([]);

  sheetOpen     = signal(false);
  sheetItem     = signal<MenuItem | null>(null);

  ngOnInit(): void {
    this.titleSvc.setTitle('Belly Bee | Best Food Near Me — Cloud Kitchen Chhatarpur, New Delhi');
    this.metaSvc.updateTag({ name: 'description', content: 'Best food near me in Chhatarpur, New Delhi! Order biryani, paranthas, dosa, burgers, tikka, pizza & rolls from Belly Bee cloud kitchen. Delivered in 30–45 min to Chhatarpur, Mehrauli, Saket, Malviya Nagar & South Delhi. Call +91 88998 88683.' });
    this.metaSvc.updateTag({ property: 'og:title', content: 'Belly Bee — Best Cloud Kitchen Near Me | Chhatarpur, New Delhi' });
    this.metaSvc.updateTag({ property: 'og:description', content: 'Fresh biryani, paranthas, dosa, burgers, tikka & more delivered in 30–45 min from Chhatarpur. Best restaurant near me in South Delhi.' });
    this.metaSvc.updateTag({ name: 'keywords', content: 'best food near me, best restaurant near me, food delivery near me, best dosa near me, best chicken near me, south indian near me, biryani near me, burger near me, pizza near me, north indian food near me, cloud kitchen near me Chhatarpur, best parantha Delhi, food delivery Chhatarpur, online food order New Delhi, tiffin service Chhatarpur, food delivery 110074' });

    this.menu.getCategories().subscribe(cats => this.categories.set(cats));

    this.menu.getFeaturedItems('bestseller').subscribe(items => {
      this.bestsellers.set(items.slice(0, 6));
    });

    this.menu.getFeaturedItems('new').subscribe(items => {
      this.newItems.set(items.slice(0, 4));
    });

    this.menu.getFeaturedItems('offer').subscribe(items => {
      this.offerItems.set(items.slice(0, 4));
      this.loading.set(false);
    });

    this.menu.getMenuItems('day-long-buzz').subscribe(items => {
      this.specials.set(items.filter(i => i.is_available).slice(0, 6));
    });

    this.ratingSvc.getPublished(8).subscribe({
      next: (r) => this.reviews.set(r),
      error: () => {},
    });
  }

  scrollToSpecials(): void {
    document.getElementById('specials')?.scrollIntoView({ behavior: 'smooth' });
  }

  onCardClick(item: MenuItem): void {
    if (item.serve_options.length > 0 || item.size_options.length > 0) {
      this.sheetItem.set(item);
      this.sheetOpen.set(true);
    } else {
      this.router.navigate(['/item', item.id]);
    }
  }

  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/menu', categoryId]);
  }
}
