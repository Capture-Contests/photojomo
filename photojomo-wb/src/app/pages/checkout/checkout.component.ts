import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { SubmissionService, Tier } from '../../services/submission.service';

interface ContestInfo {
  name: string;
  entryLabel: string;
}

const CONTESTS: Record<string, ContestInfo> = {
  'general':           { name: 'General',           entryLabel: 'Founding Creator Entry' },
  'emerging-creator':  { name: 'Emerging Creator',  entryLabel: 'Founding Creator Entry' },
  'college-creator':   { name: 'College Creator',   entryLabel: 'Founding Creator Entry' },
  'master-your-craft': { name: 'Master Your Craft', entryLabel: 'Founding Creator Entry' },
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  contest: ContestInfo = CONTESTS['general'];
  contestSlug = 'general';
  tier: Tier | null = null;
  tiersLoading = true;
  imageSlots: number[] = [];

  // Form fields
  firstName = '';
  lastName = '';
  email = '';
  country = '';
  paymentMethod = 'stripe';
  confirm1 = false;
  confirm2 = false;
  confirm3 = false;
  confirm4 = false;

  imageFiles: (File | null)[] = [];

  // UI state
  submitting = false;
  submitStatus = '';
  submitError = '';
  submitSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private submissionService: SubmissionService,
  ) {}

  async ngOnInit() {
    this.contestSlug = this.route.snapshot.paramMap.get('contestId') ?? 'general';
    const tierId     = this.route.snapshot.paramMap.get('tierId')    ?? '';
    this.contest     = CONTESTS[this.contestSlug] ?? CONTESTS['general'];

    try {
      const tiers = await this.submissionService.getTiers();
      this.tier = tiers.find(t => t.id === tierId) ?? tiers[0] ?? null;
    } catch {
      this.submitError = 'Failed to load tier information. Please refresh.';
    } finally {
      this.tiersLoading = false;
    }

    if (this.tier) {
      this.imageSlots = Array.from({ length: this.tier.maxImages }, (_, i) => i + 1);
      this.imageFiles = new Array(this.tier.maxImages).fill(null);
    }
  }

  onFileChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    this.imageFiles[index] = input.files?.[0] ?? null;
  }

  get selectedImages(): File[] {
    return this.imageFiles.filter((f): f is File => f !== null);
  }

  get formValid(): boolean {
    return !!(
      this.tier &&
      this.firstName &&
      this.lastName &&
      this.email &&
      this.country &&
      this.confirm1 &&
      this.confirm2 &&
      this.confirm3 &&
      this.selectedImages.length > 0
    );
  }

  async submit() {
    if (!this.formValid || this.submitting || !this.tier) return;

    this.submitting = true;
    this.submitError = '';

    try {
      // Step 1: Create submission
      this.submitStatus = 'Creating submission…';
      const submissionRes = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; submissionId: string; contestantId: string }>(
          `${environment.apiBaseUrl}/submissions`,
          {
            firstName:             this.firstName,
            lastName:              this.lastName,
            email:                 this.email,
            country:               this.country,
            confirmImagesDates:    this.confirm1,
            confirmAge:            this.confirm2,
            confirmRules:          this.confirm3,
            marketingConsent:      this.confirm4,
            contestId:             environment.contestId,
            contestCategoryId:     this.submissionService.getCategoryId(this.contestSlug),
            contestTierId:         this.tier.id,
            amountPaid:            this.tier.price,
            paymentMethod:         this.paymentMethod,
          }
        )
      );

      if (!submissionRes.success) {
        throw new Error(submissionRes.message || 'Submission failed');
      }

      // Step 2: Get presigned upload URLs
      this.submitStatus = 'Preparing image uploads…';
      const files = this.selectedImages;
      const presignRes = await firstValueFrom(
        this.http.post<{ success: boolean; entries: { entryId: string; uploadUrl: string; key: string }[] }>(
          `${environment.apiBaseUrl}/contest-entries/presigned-urls`,
          {
            contestantId: submissionRes.contestantId,
            submissionId: submissionRes.submissionId,
            contestId:    environment.contestId,
            files: files.map(f => ({ fileName: f.name, contentType: f.type || 'image/jpeg' })),
          }
        )
      );

      if (!presignRes.success) {
        throw new Error('Failed to prepare image uploads');
      }

      // Step 3: Upload images to S3
      this.submitStatus = 'Uploading images…';
      await Promise.all(
        presignRes.entries.map((entry, i) =>
          fetch(entry.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': files[i].type || 'image/jpeg' },
            body: files[i],
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to upload ${files[i].name}`);
          })
        )
      );

      this.submitSuccess = true;
    } catch (err: any) {
      this.submitError = err?.error?.message ?? err?.message ?? 'Submission failed. Please try again.';
    } finally {
      this.submitting = false;
      this.submitStatus = '';
    }
  }
}
