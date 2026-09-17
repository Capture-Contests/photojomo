import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-cc-contact',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './contact-connections.component.html',
  styleUrls: ['./contact-connections.component.css'],
})
export class ContactConnectionsComponent {
  /** Step 2 options, in the order the design lays them out. */
  readonly connections = [
    'Caribbean resident',
    'Caribbean heritage / diaspora',
    'Creator / artist / storyteller',
    'Traveler / frequent visitor',
    'Interested in Caribbean culture',
    'Interested in travel & experiences',
    'I simply want to explore and discover',
  ];

  /** Step 3 options. */
  readonly interests = [
    'Photography & video challenges',
    'Sweepstakes & travel opportunities',
    'Creator opportunities',
    'Caribbean stories & culture',
    'Exhibitions & events',
    'Residencies & special programs',
    'Capture Caribbean news & updates',
  ];

  /**
   * The design's country field is a "Select your country or territory"
   * dropdown with no list attached. Caribbean nations and territories come
   * first, then the wider world, since that is who the form is aimed at.
   */
  readonly countries = [
    'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Belize',
    'Bermuda', 'Bonaire', 'British Virgin Islands', 'Cayman Islands', 'Cuba',
    'Curaçao', 'Dominica', 'Dominican Republic', 'Grenada', 'Guadeloupe', 'Guyana',
    'Haiti', 'Jamaica', 'Martinique', 'Montserrat', 'Puerto Rico', 'Saba',
    'Saint Barthélemy', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Martin',
    'Saint Vincent and the Grenadines', 'Sint Eustatius', 'Sint Maarten', 'Suriname',
    'Trinidad and Tobago', 'Turks and Caicos Islands', 'United States Virgin Islands',
    '─────────────',
    'Australia', 'Brazil', 'Canada', 'China', 'Colombia', 'France', 'Germany', 'Ghana',
    'India', 'Ireland', 'Italy', 'Japan', 'Kenya', 'Mexico', 'Netherlands', 'Nigeria',
    'Panama', 'Portugal', 'South Africa', 'Spain', 'Sweden', 'Switzerland',
    'United Arab Emirates', 'United Kingdom', 'United States', 'Other',
  ];

  /** Mobile nav, matching the other Connections pages. */
  menuOpen = false;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  form: FormGroup;
  submitting = false;
  submitSuccess = false;
  submitError = false;
  showFormError = false;

  private picked: Record<'connections' | 'interests', Set<string>> = {
    connections: new Set<string>(),
    interests: new Set<string>(),
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      consent: [false],
    });
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty || this.showFormError);
  }

  isPicked(group: 'connections' | 'interests', value: string): boolean {
    return this.picked[group].has(value);
  }

  toggle(group: 'connections' | 'interests', value: string): void {
    const set = this.picked[group];
    set.has(value) ? set.delete(value) : set.add(value);
  }

  onSubmit(): void {
    this.submitSuccess = false;
    this.submitError = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showFormError = true;
      return;
    }
    this.showFormError = false;

    // TODO: no endpoint is wired up yet. The sibling contact page posts through
    // a ContactService, and sweepstakes entrants are tagged in Mailchimp — which
    // of those this form should feed (and under what tag) is still to be decided,
    // so nothing is sent anywhere yet.
    this.submitting = true;
    const payload = {
      ...this.form.value,
      connections: [...this.picked.connections],
      interests: [...this.picked.interests],
    };
    console.info('[Join Caribbean Connections] not submitted — no endpoint wired', payload);

    this.submitting = false;
    this.submitSuccess = true;
  }
}
