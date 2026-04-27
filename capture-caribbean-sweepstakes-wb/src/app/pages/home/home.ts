import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface SweepstakesRequest {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phoneNumber: string;
  address: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  countryOfResidence: string;
  contentType: string;
  agreedToRules: boolean;
  descriptors: string[];
  travelContentDetail: string;
  sharingPlatforms: string[];
  topExperiences: string[];
  typicalSpend: string;
  referralSource: string;
  bonusEntry: boolean;
}

interface SweepstakesResponse {
  id: string;
  message: string;
  success: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  encapsulation: ViewEncapsulation.None,
})
export class Home {
  // Tier 1 — contact details
  firstName = '';
  lastName = '';
  email = '';
  confirmEmail = '';
  phoneNumber = '';
  address = '';
  city = '';
  stateProvince = '';
  zipPostalCode = '';
  countryOfResidence = '';
  contentType = '';
  agreedToRules = false;

  // Tier 2 — about-you details
  descriptors: string[] = [];
  travelContentDetail = '';
  sharingPlatforms: string[] = [];
  topExperiences: string[] = [];
  typicalSpend = '';
  referralSource = '';
  bonusEntry = false;

  // Static option lists for chip groups + selects
  readonly descriptorOptions = [
    'Photographer', 'Videographer', 'Content Creator', 'Cultural Explorer',
    'Adventure Traveler', 'Travel Blogger', 'Filmmaker', 'Other',
  ];
  readonly platformOptions = [
    'Instagram', 'YouTube', 'TikTok', 'Blog', 'LinkedIn', 'Other',
  ];
  readonly experienceOptions = [
    'Cultural Immersion', 'Adventure / Thrill Seeking', 'Relaxation',
    'Luxury Stays', 'Wellness / Spirituality', 'Food & Culinary Experiences',
  ];
  readonly spendOptions = [
    'Under $1,000', '$1,000 – $2,500', '$2,500 – $5,000',
    '$5,000 – $10,000', '$10,000+',
  ];
  readonly referralOptions = [
    'Instagram', 'Facebook', 'TikTok', 'YouTube',
    'Friend / Word of mouth', 'Email', 'Other',
  ];

  // Navigation + submit state
  currentTier: 1 | 2 = 1;
  submitting = false;
  submitted = false;
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  captureLegalReturnState(): void {
    sessionStorage.setItem('legalModalReturnState', JSON.stringify({
      returnUrl: this.router.url || '/',
      returnScrollY: window.scrollY,
    }));
  }

  get tier1Valid(): boolean {
    return (
      this.firstName.trim() !== '' &&
      this.lastName.trim() !== '' &&
      this.email.trim() !== '' &&
      this.email === this.confirmEmail &&
      this.phoneNumber.trim() !== '' &&
      this.address.trim() !== '' &&
      this.city.trim() !== '' &&
      this.stateProvince.trim() !== '' &&
      this.zipPostalCode.trim() !== '' &&
      this.countryOfResidence.trim() !== '' &&
      this.agreedToRules
    );
  }

  toggleSelection(list: string[], value: string, max?: number): void {
    const idx = list.indexOf(value);
    if (idx >= 0) {
      list.splice(idx, 1);
      return;
    }
    if (max !== undefined && list.length >= max) return;
    list.push(value);
  }

  isSelected(list: string[], value: string): boolean {
    return list.indexOf(value) >= 0;
  }

  goToTier2(): void {
    if (!this.tier1Valid) return;
    this.currentTier = 2;
    window.scrollTo({ top: this.scrollAnchor(), behavior: 'smooth' });
  }

  goToTier1(): void {
    this.currentTier = 1;
    window.scrollTo({ top: this.scrollAnchor(), behavior: 'smooth' });
  }

  private scrollAnchor(): number {
    const el = document.querySelector('.sw-form-section');
    if (!el) return 0;
    return (el as HTMLElement).offsetTop - 16;
  }

  async onSubmit(): Promise<void> {
    if (!this.tier1Valid || this.submitting) return;

    this.submitting = true;
    this.errorMessage = '';

    const payload: SweepstakesRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      confirmEmail: this.confirmEmail.trim(),
      phoneNumber: this.phoneNumber.trim(),
      address: this.address.trim(),
      city: this.city.trim(),
      stateProvince: this.stateProvince.trim(),
      zipPostalCode: this.zipPostalCode.trim(),
      countryOfResidence: this.countryOfResidence.trim(),
      contentType: this.contentType.trim(),
      agreedToRules: this.agreedToRules,
      descriptors: [...this.descriptors],
      travelContentDetail: this.travelContentDetail.trim(),
      sharingPlatforms: [...this.sharingPlatforms],
      topExperiences: [...this.topExperiences],
      typicalSpend: this.typicalSpend,
      referralSource: this.referralSource,
      bonusEntry: this.bonusEntry,
    };

    try {
      await firstValueFrom(
        this.http.post<SweepstakesResponse>(
          `${environment.apiBaseUrl}/sweepstakes`,
          payload
        )
      );
      this.submitted = true;
    } catch (err) {
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.submitting = false;
    }
  }
}
