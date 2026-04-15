import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
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
  private menu   = inject(MenuService);
  private router = inject(Router);

  categories    = signal<Category[]>([]);
  bestsellers   = signal<MenuItem[]>([]);
  newItems      = signal<MenuItem[]>([]);
  offerItems    = signal<MenuItem[]>([]);
  loading       = signal(true);

  sheetOpen     = signal(false);
  sheetItem     = signal<MenuItem | null>(null);

  ngOnInit(): void {
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
