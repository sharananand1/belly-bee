import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { AddressService } from '../../../core/services/address.service';
import { User } from '../../../models';
import { Address, AddressLabel } from '../../../models/address.model';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile-home.component.html',
  styleUrl:    './profile-home.component.css',
})
export class ProfileHomeComponent implements OnInit {
  private auth    = inject(AuthService);
  private theme   = inject(ThemeService);
  private toast   = inject(ToastService);
  private router  = inject(Router);
  private addrSvc = inject(AddressService);

  user    = signal<User | null>(null);
  loading = signal(true);
  editing = signal(false);
  saving  = signal(false);

  editName  = signal('');
  editEmail = signal('');

  // ── Address management ──
  addresses       = signal<Address[]>([]);
  showAddresses   = signal(false);
  addrLoading     = signal(false);
  editingAddr     = signal<Address | null>(null);
  editAddrLabel   = signal<AddressLabel>('Home');
  editAddrLandmark = signal('');
  savingAddr      = signal(false);

  readonly addressLabels: AddressLabel[] = ['Home', 'Work', 'Other'];

  readonly isDark   = computed(() => this.theme.theme() === 'dark');
  readonly initials = computed(() => {
    const u = this.user();
    if (!u?.name) return '?';
    return u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  ngOnInit(): void {
    const cached = this.auth.getCachedUser();
    if (cached) { this.user.set(cached); this.loading.set(false); }
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
      next: u => { this.user.set(u); this.editing.set(false); this.saving.set(false); this.toast.success('Profile updated!'); },
      error: () => { this.saving.set(false); this.toast.error('Failed to update profile. Try again.'); },
    });
  }

  toggleAddresses(): void {
    if (this.showAddresses()) { this.showAddresses.set(false); return; }
    this.showAddresses.set(true);
    if (!this.addresses().length) {
      this.addrLoading.set(true);
      this.addrSvc.getSavedAddresses().subscribe({
        next: list => { this.addresses.set(list); this.addrLoading.set(false); },
        error: () => { this.addrLoading.set(false); this.toast.error('Could not load addresses'); },
      });
    }
  }

  startEditAddr(addr: Address): void {
    this.editingAddr.set({ ...addr });
    this.editAddrLabel.set(addr.label);
    this.editAddrLandmark.set(addr.landmark ?? '');
  }

  cancelEditAddr(): void { this.editingAddr.set(null); }

  saveEditAddr(): void {
    const addr = this.editingAddr();
    if (!addr?.id) return;
    this.savingAddr.set(true);
    this.addrSvc.updateAddress(addr.id, { label: this.editAddrLabel(), landmark: this.editAddrLandmark() }).subscribe({
      next: updated => {
        this.addresses.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.editingAddr.set(null);
        this.savingAddr.set(false);
        this.toast.success('Address updated');
      },
      error: () => { this.savingAddr.set(false); this.toast.error('Failed to update address'); },
    });
  }

  deleteAddr(id: string): void {
    if (!confirm('Delete this address?')) return;
    this.addrSvc.deleteAddress(id).subscribe({
      next: () => { this.addresses.update(list => list.filter(a => a.id !== id)); this.toast.success('Address deleted'); },
      error: () => this.toast.error('Failed to delete address'),
    });
  }

  toggleTheme(): void { this.theme.toggle(); }

  logout(): void {
    this.auth.logout();
    this.toast.success('Logged out successfully');
    this.router.navigate(['/main']);
  }

  onImgError(img: HTMLImageElement): void { img.src = 'assets/bellyBeeLogo.webp'; }
}
