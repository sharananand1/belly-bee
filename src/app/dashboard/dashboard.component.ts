import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  today = new Date();

  mostSold = [
    { id: 'ms1', name: 'Chicken Biryani', img: 'assets/chicken-biryani.jpg', tag: 'Bestseller' },
    { id: 'ms2', name: 'Paneer Butter Masala', img: 'assets/paneer-butter-masala.jpg', tag: 'Veg Favourite' },
    { id: 'ms3', name: 'Pav Bhaji', img: 'assets/pav-bhaji.jpg', tag: 'Street Style' },
    { id: 'ms4', name: 'Mutton Korma', img: 'assets/mutton-korma.jpeg', tag: 'Premium' }
  ];

  discounts = [
    { id: 'd1', name: 'Butter Chicken', off: 15, img: 'assets/butter-chicken.webp' },
    { id: 'd2', name: 'Veg Pulao', off: 10, img: 'assets/veg-pulao.jpg' },
    { id: 'd3', name: 'Chicken Shawarma', off: 12, img: 'assets/chicken-shawarma.webp' }
  ];

  chefs = [
    { id: 'c1', name: 'Chef Anaya', spec: 'North Indian', img: 'assets/chef1.jpg' },
    { id: 'c2', name: 'Chef Rohan', spec: 'Tandoor & Grills', img: 'assets/chef2.jpg' },
    { id: 'c3', name: 'Chef Meera', spec: 'Home-style Veg', img: 'assets/chef3.jpg' }
  ];

  ratings = [
    { id: 'r1', user: 'Arjun', stars: 5, text: 'True ghar-ka-khana vibes. Super fresh.' },
    { id: 'r2', user: 'Sana', stars: 4.5, text: 'Clean kitchen, quick delivery, great taste.' },
    { id: 'r3', user: 'Dev', stars: 4.8, text: 'Butter Chicken is a must-try. No heaviness.' }
  ];

  trackById(_: number, item: any) { return item.id; }

}
