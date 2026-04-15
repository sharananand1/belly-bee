import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { Category } from '../../models/category.model';
import { MenuItem, ItemTag } from '../../models/menu-item.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api  = inject(ApiService);
  private mock = inject(MockDataService);

  getCategories(): Observable<Category[]> {
    if (environment.useMock) return this.mock.getCategories();
    return this.api.get<Category[]>('/menu/categories');
  }

  getMenuItems(categoryId?: string): Observable<MenuItem[]> {
    if (environment.useMock) return this.mock.getMenuItems(categoryId);
    const params = categoryId ? { category_id: categoryId } : undefined;
    return this.api.get<MenuItem[]>('/menu/items', params);
  }

  getItemById(id: string): Observable<MenuItem | undefined> {
    if (environment.useMock) return this.mock.getItemById(id);
    return this.api.get<MenuItem>(`/menu/items/${id}`);
  }

  searchItems(query: string): Observable<MenuItem[]> {
    if (environment.useMock) return this.mock.searchItems(query);
    return this.api.get<MenuItem[]>('/menu/search', { q: query });
  }

  getFeaturedItems(tag: ItemTag): Observable<MenuItem[]> {
    if (environment.useMock) return this.mock.getFeaturedItems(tag);
    return this.api.get<MenuItem[]>('/menu/featured', { tag });
  }
}
