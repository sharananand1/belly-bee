import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ColorTheme = 'light' | 'dark';

const THEME_KEY = 'bb_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly theme = signal<ColorTheme>(this._loadTheme());

  constructor() {
    // Sync signal → DOM whenever it changes
    effect(() => {
      const t = this.theme();
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
      }
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }

  setTheme(t: ColorTheme): void {
    this.theme.set(t);
  }

  get isDark(): boolean {
    return this.theme() === 'dark';
  }

  private _loadTheme(): ColorTheme {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(THEME_KEY) as ColorTheme | null;
      if (stored === 'light' || stored === 'dark') return stored;
      // Respect OS preference on first visit
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  }
}
