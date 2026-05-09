import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SubmissionService, Tier } from '../../core/submission.service';

@Component({
  selector: 'app-contest-tiers',
  imports: [RouterLink],
  templateUrl: './contest-tiers.html',
  styleUrl: './contest-tiers.scss',
})
export class ContestTiers implements OnInit {
  @Input() division = 'general';
  tiers: Tier[] = [];
  tiersLoading = true;
  tiersError = false;
  private readonly router = inject(Router);
  private readonly submissionService = inject(SubmissionService);

  async ngOnInit() {
    try {
      this.tiers = await this.submissionService.getTiers();
    } catch {
      this.tiersError = true;
    } finally {
      this.tiersLoading = false;
    }
  }

  get divisionLabel() {
    const labels: Record<string, string> = {
      'general':           'General',
      'emerging-creator':  'Emerging Creator',
      'college-creator':   'College Creator',
      'master-your-craft': 'Master Your Craft',
    };
    return labels[this.division] ?? 'Contest';
  }

  tierLabel(tier: Tier): string {
    const parts = tier.name.split(' - ');
    return parts[0] ?? tier.name;
  }

  tierVariant(tier: Tier): string {
    const parts = tier.name.split(' - ');
    return parts[1] ?? '';
  }

  formatPrice(price: number): string {
    return `$${price}`;
  }

  formatImages(maxImages: number): string {
    return maxImages === 5 ? '1-5 images' : `Up to ${maxImages} images`;
  }

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
