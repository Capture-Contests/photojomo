import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface TierInfo {
  name: string;
  price: number;
  maxImages: number;
  label: string;
  apiTier: string;
}

interface ContestInfo {
  name: string;
  entryLabel: string;
  apiCategory: string;
}

const TIERS: Record<string, TierInfo> = {
  'tier-1': { name: 'Tier 1 – Explorer',    price: 25, maxImages: 5,  label: 'Explorer Entry',    apiTier: 'explorer' },
  'tier-2': { name: 'Tier 2 – Enthusiast',  price: 45, maxImages: 10, label: 'Enthusiast Entry',  apiTier: 'enthusiast' },
  'tier-3': { name: 'Tier 3 – Visionary',   price: 65, maxImages: 15, label: 'Visionary Entry',   apiTier: 'visionary' },
  'tier-4': { name: 'Tier 4 – Master',      price: 95, maxImages: 25, label: 'Master Entry',      apiTier: 'master' },
};

const CONTESTS: Record<string, ContestInfo> = {
  'general':           { name: 'General',           entryLabel: 'Founding Creator Entry', apiCategory: 'general' },
  'emerging-creator':  { name: 'Emerging Creator',  entryLabel: 'Founding Creator Entry', apiCategory: 'emerging_creator' },
  'college-creator':   { name: 'College Creator',   entryLabel: 'Founding Creator Entry', apiCategory: 'college_creator' },
  'master-your-craft': { name: 'Master Your Craft', entryLabel: 'Founding Creator Entry', apiCategory: 'master_your_craft' },
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
  tier: TierInfo = TIERS['tier-1'];
  contestId = 'general';
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

  // Image files per slot (index = slot - 1)
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
  ) {}

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    };
  }

  ngOnInit() {
    const contestId = this.route.snapshot.paramMap.get('contestId') ?? 'general';
    const tierId    = this.route.snapshot.paramMap.get('tierId')    ?? 'tier-1';
    this.contestId  = contestId;
    this.contest    = CONTESTS[contestId] ?? CONTESTS['general'];
    this.tier       = TIERS[tierId]       ?? TIERS['tier-1'];
    this.imageSlots = Array.from({ length: this.tier.maxImages }, (_, i) => i + 1);
    this.imageFiles = new Array(this.tier.maxImages).fill(null);
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
    if (!this.formValid || this.submitting) return;

    this.submitting = true;
    this.submitError = '';

    try {
      // Step 1: Create submission
      this.submitStatus = 'Creating submission…';
      const submissionRes = await firstValueFrom(
        this.http.post<{ success: boolean; message: string; submissionId: string; contestantId: string }>(
          `${environment.apiBaseUrl}/submissions`,
          {
            firstName:          this.firstName,
            lastName:           this.lastName,
            email:              this.email,
            country:            this.country,
            confirmImagesDates: this.confirm1,
            confirmAge:         this.confirm2,
            confirmRules:       this.confirm3,
            marketingConsent:   this.confirm4,
            category:           this.contest.apiCategory,
            tier:               this.tier.apiTier,
            amountPaid:         this.tier.price,
            paymentMethod:      this.paymentMethod,
          }
        )
      );

      if (!submissionRes.success) {
        throw new Error(submissionRes.message || 'Submission failed');
      }

      const submissionId = submissionRes.submissionId;

      // Step 2: Get presigned upload URLs
      this.submitStatus = 'Preparing image uploads…';
      const files = this.selectedImages;
      const presignRes = await firstValueFrom(
        this.http.post<{ success: boolean; entries: { entryId: string; uploadUrl: string; key: string }[] }>(
          `${environment.apiBaseUrl}/contest-entries/presigned-urls`,
          {
            contestantId: submissionRes.contestantId,
            submissionId,
            files: files.map(f => ({ fileName: f.name, contentType: f.type || 'image/jpeg' })),
          }
        )
      );

      if (!presignRes.success) {
        throw new Error('Failed to prepare image uploads');
      }

      // Step 3: Upload images directly to S3
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
