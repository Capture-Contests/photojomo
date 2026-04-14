import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContestTiers } from '../../../shared/contest-tiers/contest-tiers';

@Component({
  selector: 'app-college-creator',
  imports: [ContestTiers, RouterLink],
  templateUrl: './college-creator.html',
  styleUrl: './college-creator.scss',
})
export class CollegeCreator {
  private readonly router = inject(Router);

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
