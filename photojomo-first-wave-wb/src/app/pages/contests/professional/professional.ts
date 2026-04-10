import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContestTiers } from '../../../shared/contest-tiers/contest-tiers';
import { EntryForm } from '../../../shared/entry-form/entry-form';

@Component({
  selector: 'app-professional',
  imports: [ContestTiers, EntryForm, RouterLink],
  templateUrl: './professional.html',
  styleUrl: './professional.scss',
})
export class Professional {
  private readonly router = inject(Router);

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
