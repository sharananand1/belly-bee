// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainComponent } from './main/main.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Belly Bee – Home' },
  { path: 'main', component: MainComponent, title: 'Belly Bee – Menu' },
  { path: 'checkout', component: CheckoutComponent, title: 'Belly Bee – Checkout' },
  { path: 'login', component: LoginComponent, title: 'Belly Bee – Login' },
  { path: '**', redirectTo: 'dashboard' }
];
