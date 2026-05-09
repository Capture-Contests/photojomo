import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SubmissionService, Tier } from '../../core/submission.service';
import { COUNTRIES } from './countries';

interface UploadSlot { index: number; file: File | null; preview: string | null; }

@Component({
  selector: 'app-entry-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './entry-form.html',
  styleUrl: './entry-form.scss',
})
export class EntryForm implements OnInit {
  @Input() division = 'General';
  private readonly router = inject(Router);
  private readonly submissionService = inject(SubmissionService);

  countries = COUNTRIES;
  tiers: Tier[] = [];
  selectedTier: Tier | null = null;
  paymentMethod: 'stripe' | 'paypal' = 'stripe';

  form = {
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    confirmAge: false,
    confirmDates: false,
    agreePrivacy: false,
    agreeTerms: false,
  };

  uploadSlots: UploadSlot[] = [];
  submitted = false;
  submitting = false;

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    try {
      this.tiers = await this.submissionService.getTiers();
    } catch {
      return;
    }

    const tierParam = this.route.snapshot.queryParamMap.get('tier');
    const match = tierParam ? this.tiers.find(t => t.name === tierParam) : null;
    this.selectedTier = match ?? this.tiers[0] ?? null;
    this.updateUploadSlots();
  }

  onTierChange() {
    this.updateUploadSlots();
  }

  private updateUploadSlots() {
    const max = this.selectedTier?.maxImages ?? 5;
    this.uploadSlots = Array.from({ length: max }, (_, i) => ({
      index: i + 1,
      file: null,
      preview: null,
    }));
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

  get maxImages(): number {
    return this.selectedTier?.maxImages ?? 5;
  }

  get uploadedCount(): number {
    return this.uploadSlots.filter(s => s.file).length;
  }

  async onSubmit() {
    this.submitting = true;
    await new Promise(r => setTimeout(r, 1200));
    this.submitted = true;
    this.submitting = false;
  }

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
