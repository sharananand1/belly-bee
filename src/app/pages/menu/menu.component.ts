import { Component, inject, OnInit, OnDestroy, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  private destroy$   = new Subject<void>();

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
    });

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q.trim()) return this.menuSvc.getMenuItems(this.activeCategory() || undefined);
        this.analytics.search(q, 0);
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
}
