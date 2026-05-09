import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SubmissionService, Tier } from '../../services/submission.service';

interface ContestInfo {
  title: string;
}

const CONTESTS: Record<string, ContestInfo> = {
  'general':           { title: 'General Contest' },
  'emerging-creator':  { title: 'Emerging Creator Contest' },
  'college-creator':   { title: 'College Creator Contest' },
  'master-your-craft': { title: 'Master Your Craft Contest' },
};

@Component({
  selector: 'app-contest-entry',
  standalone: true,
  imports: [RouterLink, CommonModule, NavbarComponent],
  templateUrl: './contest-entry.component.html',
  styleUrls: ['./contest-entry.component.css'],
})
export class ContestEntryComponent implements OnInit {
  contest: ContestInfo = CONTESTS['general'];
  contestId = 'general';
  tiers: Tier[] = [];
  tiersLoading = true;
  tiersError = false;

  constructor(
    private route: ActivatedRoute,
    private submissionService: SubmissionService,
  ) {}

  async ngOnInit() {
    this.contestId = this.route.snapshot.paramMap.get('id') ?? 'general';
    this.contest   = CONTESTS[this.contestId] ?? CONTESTS['general'];

    try {
      this.tiers = await this.submissionService.getTiers();
    } catch {
      this.tiersError = true;
    } finally {
      this.tiersLoading = false;
    }
  }

  formatImages(maxImages: number): string {
    return maxImages === 5 ? '1-5 images' : `Up to ${maxImages} images`;
  }
}
