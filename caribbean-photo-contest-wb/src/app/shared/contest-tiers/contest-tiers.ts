import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

export interface Tier {
  name: string;
  price: string;
  images: string;
  benefits: string[];
  golden: boolean;
}

export const TIERS: Tier[] = [
  {
    name: 'Tier 1 - Explorer',
    price: '$25',
    images: '1-5 images',
    benefits: ['Eligible for judging', 'Founding Class Member Badge'],
    golden: false,
  },
  {
    name: 'Tier 2 - Enthusiast',
    price: '$45',
    images: 'Up to 10 images',
    benefits: ['Eligible for judging', 'Founding Class Member Badge'],
    golden: false,
  },
  {
    name: 'Tier 3 - Visionary',
    price: '$65',
    images: 'Up to 15 images',
    benefits: ['Eligible for judging', 'Founding Class Member Badge'],
    golden: false,
  },
  {
    name: 'Tier 4 - Master',
    price: '$95',
    images: 'Up to 25 images',
    benefits: ['Eligible for judging', 'Founding Class Member Badge'],
    golden: true,
  },
];

@Component({
  selector: 'app-contest-tiers',
  imports: [RouterLink],
  templateUrl: './contest-tiers.html',
  styleUrl: './contest-tiers.scss',
})
export class ContestTiers {
  @Input() division = 'general';
  tiers = TIERS;
  private readonly router = inject(Router);

  get divisionLabel() {
    const labels: Record<string, string> = {
      'general':           'General',
      'emerging-creator':  'Emerging Creator',
      'college-creator':   'College Creator',
      'master-your-craft': 'Master Your Craft',
    };

    return labels[this.division] ?? 'Contest';
  }

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
