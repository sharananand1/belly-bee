import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../models';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile-home.component.html',
  styleUrl:    './profile-home.component.css',
})
export class ProfileHomeComponent implements OnInit {
  private auth   = inject(AuthService);
  private theme  = inject(ThemeService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  user    = signal<User | null>(null);
  loading = signal(true);
  editing = signal(false);
  saving  = signal(false);

  editName  = signal('');
  editEmail = signal('');

  readonly isDark    = computed(() => this.theme.theme() === 'dark');
  readonly initials  = computed(() => {
    const u = this.user();
    if (!u?.name) return '?';
    return u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  ngOnInit(): void {
    // Try cache first for instant display
    const cached = this.auth.getCachedUser();
    if (cached) {
      this.user.set(cached);
      this.loading.set(false);
    }
    this.auth.getProfile().subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  startEdit(): void {
    const u = this.user();
    if (!u) return;
    this.editName.set(u.name);
    this.editEmail.set(u.email ?? '');
    this.editing.set(true);
  }

  cancelEdit(): void { this.editing.set(false); }

  saveEdit(): void {
    const name = this.editName().trim();
    if (!name) { this.toast.error('Name cannot be empty'); return; }
    this.saving.set(true);
    this.auth.updateProfile({ name, email: this.editEmail().trim() || undefined }).subscribe({
      next: u => {
        this.user.set(u);
        this.editing.set(false);
        this.saving.set(false);
        this.toast.success('Profile updated!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to update profile. Try again.');
      },
    });
  }

  toggleTheme(): void { this.theme.toggle(); }

  logout(): void {
    this.auth.logout();
    this.toast.success('Logged out successfully');
    this.router.navigate(['/main']);
  }

  onImgError(img: HTMLImageElement): void {
    img.src = 'assets/bellyBeeLogo.webp';
  }
}
