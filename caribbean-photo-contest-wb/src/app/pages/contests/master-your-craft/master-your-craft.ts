import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContestTiers } from '../../../shared/contest-tiers/contest-tiers';

@Component({
  selector: 'app-master-your-craft',
  imports: [ContestTiers, RouterLink],
  templateUrl: './master-your-craft.html',
  styleUrl: './master-your-craft.scss',
})
export class MasterYourCraft {
  private readonly router = inject(Router);

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
