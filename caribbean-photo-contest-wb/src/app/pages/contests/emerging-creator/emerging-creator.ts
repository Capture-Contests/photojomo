import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContestTiers } from '../../../shared/contest-tiers/contest-tiers';

@Component({
  selector: 'app-emerging-creator',
  imports: [ContestTiers, RouterLink],
  templateUrl: './emerging-creator.html',
  styleUrl: './emerging-creator.scss',
})
export class EmergingCreator {
  private readonly router = inject(Router);

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
