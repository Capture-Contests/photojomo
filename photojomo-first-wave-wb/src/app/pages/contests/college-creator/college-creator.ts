import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContestTiers } from '../../../shared/contest-tiers/contest-tiers';
import { EntryForm } from '../../../shared/entry-form/entry-form';

@Component({
  selector: 'app-college-creator',
  imports: [ContestTiers, EntryForm, RouterLink],
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
