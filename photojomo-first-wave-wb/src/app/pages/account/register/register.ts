import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TIERS, Tier } from '../../../shared/contest-tiers/contest-tiers';
import { COUNTRIES } from '../../../shared/entry-form/countries';
import { SubmissionService } from '../../../core/submission.service';

interface UploadSlot { index: number; file: File | null; preview: string | null; }

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  division = '';
  selectedTier: Tier | null = null;
  countries = COUNTRIES;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    emailCode: '',
    country: '',
    confirmDates: false,
    confirmAge: false,
    agreeRules: false,
    subscribeOffers: false,
  };

  uploadSlots: UploadSlot[] = [];
  paymentMethod: 'stripe' | 'paypal' = 'stripe';
  submitted = false;
  submitting = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private submissionService: SubmissionService,
  ) {}

  ngOnInit() {
    this.division = this.route.snapshot.queryParamMap.get('division') ?? '';
    const tierName = this.route.snapshot.queryParamMap.get('tier') ?? '';
    const match = TIERS.find(t => t.name === tierName);
    if (match) {
      this.selectedTier = match;
      this.buildUploadSlots(match);
    }
  }

  private buildUploadSlots(tier: Tier) {
    const max = this.maxImages(tier);
    this.uploadSlots = Array.from({ length: max }, (_, i) => ({
      index: i + 1, file: null, preview: null,
    }));
  }

  maxImages(tier: Tier): number {
    if (tier.name.includes('1')) return 5;
    if (tier.name.includes('2')) return 10;
    if (tier.name.includes('3')) return 15;
    return 25;
  }

  onFileSelect(event: Event, slot: UploadSlot) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    slot.file = file;
    const reader = new FileReader();
    reader.onload = e => slot.preview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removeFile(slot: UploadSlot) {
    slot.file = null;
    slot.preview = null;
  }

  get uploadedCount(): number {
    return this.uploadSlots.filter(s => s.file).length;
  }

  async onSubmit() {
    if (!this.selectedTier) return;

    this.submitting = true;
    this.errorMessage = '';

    try {
      await this.submissionService.submit({
        firstName:          this.form.firstName,
        lastName:           this.form.lastName,
        email:              this.form.email,
        country:            this.form.country,
        confirmImagesDates: this.form.confirmDates,
        confirmAge:         this.form.confirmAge,
        confirmRules:       this.form.agreeRules,
        marketingConsent:   this.form.subscribeOffers,
        division:           this.division,
        tierName:           this.selectedTier.name,
        paymentMethod:      this.paymentMethod,
        files:              this.uploadSlots.map(s => s.file).filter((f): f is File => f !== null),
      });
      this.submitted = true;
    } catch (err) {
      console.error('Submission failed', err);
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.submitting = false;
    }
  }
}
