import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TIERS, Tier } from '../contest-tiers/contest-tiers';
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

  countries = COUNTRIES;
  tiers = TIERS;
  selectedTier: Tier = TIERS[0];
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

  ngOnInit() {
    const tierParam = this.route.snapshot.queryParamMap.get('tier');
    if (tierParam) {
      const match = this.tiers.find(t => t.name === tierParam);
      if (match) this.selectedTier = match;
    }
    this.updateUploadSlots();
  }

  get maxImages(): number {
    if (this.selectedTier.name.includes('1')) return 5;
    if (this.selectedTier.name.includes('2')) return 10;
    if (this.selectedTier.name.includes('3')) return 15;
    return 25;
  }

  onTierChange() {
    this.updateUploadSlots();
  }

  private updateUploadSlots() {
    const max = this.maxImages;
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

  get uploadedCount(): number {
    return this.uploadSlots.filter(s => s.file).length;
  }

  async onSubmit() {
    this.submitting = true;
    // Payment processing will be wired to Stripe/PayPal Cloudflare Worker
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
