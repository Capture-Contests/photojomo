import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContestTiers } from '../../../shared/contest-tiers/contest-tiers';
import { EntryForm } from '../../../shared/entry-form/entry-form';

@Component({
  selector: 'app-general',
  imports: [ContestTiers, EntryForm, RouterLink],
  templateUrl: './general.html',
  styleUrl: './general.scss',
})
export class General {
  private readonly router = inject(Router);

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
