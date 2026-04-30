import { Component, inject, OnInit, OnDestroy, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MenuService } from '../../core/services/menu.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Category } from '../../models/category.model';
import { MenuItem } from '../../models/menu-item.model';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { CustomizationSheetComponent } from '../../shared/components/customization-sheet/customization-sheet.component';

type VegFilter = 'all' | 'veg' | 'non-veg';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCardComponent, SkeletonLoaderComponent, CustomizationSheetComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit, OnDestroy {
  /** Route param bound via withComponentInputBinding */
  @Input() categoryId?: string;

  private menuSvc    = inject(MenuService);
  private analytics  = inject(AnalyticsService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private titleSvc   = inject(Title);
  private metaSvc    = inject(Meta);
  private destroy$   = new Subject<void>();

  private readonly CATEGORY_META: Record<string, { title: string; desc: string }> = {
    'morning-buzz':         { title: 'Breakfast Near Me | Morning Delivery Chhatarpur — Belly Bee', desc: 'Fresh breakfast near you! Paranthas, dosa, sandwiches delivered in 30 min from Chhatarpur cloud kitchen. Serving Mehrauli, Saket, Malviya Nagar, South Delhi.' },
    'indian-south-buzz':    { title: 'South Indian Food Near Me | Best Dosa Idli Delivery Delhi — Belly Bee', desc: 'Best dosa, idli, vada & uttapam near me! Authentic South Indian food delivered from Belly Bee, Chhatarpur to Mehrauli, Saket, Malviya Nagar.' },
    'day-long-buzz':        { title: 'North Indian Food Near Me | Biryani Chicken Delivery Chhatarpur — Belly Bee', desc: 'Best biryani, chicken, paneer near me! Full North Indian meals all day from Chhatarpur cloud kitchen. Delivered to Mehrauli, Saket, Malviya Nagar, South Delhi.' },
    'breads-rice':          { title: 'Biryani & Rice Near Me | Roti Naan Delivery South Delhi — Belly Bee', desc: 'Best biryani, jeera rice, naan & roti near me! Fresh bread & rice from Belly Bee Chhatarpur delivered to South Delhi in 30–45 min.' },
    'sandwich-stings':      { title: 'Best Sandwich Near Me | Grilled Sandwich Delivery Chhatarpur — Belly Bee', desc: 'Best grilled sandwiches near me! Chicken, mutton, veg sandwiches delivered from Chhatarpur to Mehrauli, Saket, Malviya Nagar, South Delhi.' },
    'burger-buzz':          { title: 'Best Burger Near Me | Burger Delivery Chhatarpur South Delhi — Belly Bee', desc: 'Best burgers near me! Juicy veg & non-veg burgers delivered from Belly Bee cloud kitchen, Chhatarpur, New Delhi. Order online now!' },
    'pizza-hive':           { title: 'Best Pizza Near Me | Pizza Delivery Chhatarpur South Delhi — Belly Bee', desc: 'Best pizza near me in Chhatarpur! Fresh pizzas made to order, delivered in 30–45 min to Mehrauli, Saket, Malviya Nagar, South Delhi.' },
    'rolls-roars':          { title: 'Best Roll Near Me | Kathi Roll Wrap Delivery Chhatarpur — Belly Bee', desc: 'Best kathi rolls, frankie & wraps near me! Hot rolls delivered from Belly Bee Chhatarpur to Mehrauli, Malviya Nagar, Saket, South Delhi.' },
    'noody-noodles':        { title: 'Best Noodles Near Me | Chinese Noodle Delivery Chhatarpur Delhi — Belly Bee', desc: 'Best noodles near me! Hakka, Schezwan noodles delivered hot from Belly Bee Chhatarpur to Mehrauli, Malviya Nagar, Saket, South Delhi.' },
    'takka-tak-tikkas':     { title: 'Best Chicken Near Me | Tikka Tandoori Delivery Chhatarpur — Belly Bee', desc: 'Best chicken near me! Chicken tikka, tandoori, paneer tikka delivered fresh from Belly Bee cloud kitchen, Chhatarpur, New Delhi. Order online!' },
    'buzzed-without-booze': { title: 'Best Drinks Near Me | Mocktails Shakes Delivery Chhatarpur — Belly Bee', desc: 'Best drinks & shakes near me! Mocktails, lassi, cold coffees & fresh shakes from Belly Bee Chhatarpur delivered across South Delhi.' },
  };

  categories      = signal<Category[]>([]);
  allItems        = signal<MenuItem[]>([]);
  activeCategory  = signal<string>('');
  vegFilter       = signal<VegFilter>('all');
  searchQuery     = signal('');
  loading         = signal(true);
  sidebarOpen     = signal(false);

  sheetOpen  = signal(false);
  sheetItem  = signal<MenuItem | null>(null);

  private searchSubject = new Subject<string>();

  filteredItems = computed(() => {
    let items = this.allItems();
    const vf = this.vegFilter();
    if (vf === 'veg')     items = items.filter(i => i.is_veg);
    if (vf === 'non-veg') items = items.filter(i => !i.is_veg);
    return items;
  });

  ngOnInit(): void {
    this.menuSvc.getCategories().pipe(takeUntil(this.destroy$)).subscribe(cats => {
      this.categories.set(cats);
    });

    // When route param changes, load items for that category
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const catId = params.get('categoryId') ?? '';
      this.activeCategory.set(catId);
      this.loadItems(catId);
      this.updateMeta(catId);
    });

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q.trim()) return this.menuSvc.getMenuItems(this.activeCategory() || undefined);
        this.analytics.trackEvent('menu_item_viewed', { query: q });
        return this.menuSvc.searchItems(q);
      }),
      takeUntil(this.destroy$)
    ).subscribe(items => {
      this.allItems.set(items);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems(categoryId: string): void {
    this.loading.set(true);
    this.searchQuery.set('');
    this.menuSvc.getMenuItems(categoryId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.allItems.set(items);
        this.loading.set(false);
      });
  }

  selectCategory(catId: string): void {
    this.sidebarOpen.set(false);
    if (catId) {
      this.router.navigate(['/menu', catId]);
    } else {
      this.router.navigate(['/menu']);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  setVegFilter(f: VegFilter): void {
    this.vegFilter.set(f);
  }

  onCardClick(item: MenuItem): void {
    if (item.serve_options.length > 0 || item.size_options.length > 0) {
      this.sheetItem.set(item);
      this.sheetOpen.set(true);
    } else {
      this.router.navigate(['/item', item.id]);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  activeCategoryName(): string {
    const id = this.activeCategory();
    if (!id) return 'All Items';
    return this.categories().find(c => c.id === id)?.name ?? 'Menu';
  }

  get skeletons(): number[] { return [1,2,3,4,5,6,7,8]; }

  private updateMeta(catId: string): void {
    if (catId && this.CATEGORY_META[catId]) {
      const m = this.CATEGORY_META[catId];
      this.titleSvc.setTitle(m.title);
      this.metaSvc.updateTag({ name: 'description', content: m.desc });
      this.metaSvc.updateTag({ property: 'og:title', content: m.title });
      this.metaSvc.updateTag({ property: 'og:description', content: m.desc });
    } else {
      this.titleSvc.setTitle('Full Menu — Best Food Near Me | Belly Bee Cloud Kitchen, Chhatarpur');
      this.metaSvc.updateTag({ name: 'description', content: 'Browse Belly Bee\'s full menu — biryani, paranthas, best dosa near me, burgers, tikka, pizza, rolls & more. Fresh food delivered in 30–45 min to Chhatarpur, Mehrauli, Saket, Malviya Nagar & South Delhi.' });
      this.metaSvc.updateTag({ property: 'og:title', content: 'Full Menu — Belly Bee Cloud Kitchen, Chhatarpur, New Delhi' });
      this.metaSvc.updateTag({ property: 'og:description', content: 'Best food near me — biryani, paranthas, dosa, burgers, tikka, pizza, rolls & more from Belly Bee Chhatarpur cloud kitchen. Order online!' });
    }
  }
}
