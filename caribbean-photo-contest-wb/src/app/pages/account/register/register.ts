import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { loadScript } from '@paypal/paypal-js';
import { TIERS, Tier } from '../../../shared/contest-tiers/contest-tiers';
import { COUNTRIES } from '../../../shared/entry-form/countries';
import { SubmissionService } from '../../../core/submission.service';
import { environment } from '../../../../environments/environment';

interface UploadSlot { index: number; file: File | null; preview: string | null; }

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private readonly router = inject(Router);
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
  stripeLoading = false;
  paypalLoading = false;
  errorMessage = '';
  modalMessage = '';

  @ViewChild('f') ngForm!: NgForm;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentIntentId = '';
  paypalButtons: any = null;
  private paypalFormInvalid = false;

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
      this.initStripeElements(match.name);
    }
  }

  private async initStripeElements(tierName: string) {
    this.stripeLoading = true;
    try {
      const { clientSecret, paymentIntentId } = await this.submissionService.createPaymentIntent(tierName);
      this.paymentIntentId = paymentIntentId;

      const stripe = await loadStripe(environment.stripePublishableKey);
      if (!stripe) {
        this.errorMessage = 'Failed to load payment processor. Please refresh.';
        return;
      }
      this.stripe = stripe;

      this.elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#d8a74d',
            fontFamily: 'Open Sauce One, system-ui, sans-serif',
            borderRadius: '4px',
          },
        },
      });

      const paymentElement = this.elements.create('payment');

      setTimeout(() => {
        const mountEl = document.getElementById('stripe-payment-element');
        if (mountEl) paymentElement.mount(mountEl);
      }, 0);
    } catch (err) {
      console.error('Failed to initialize Stripe:', err);
      this.errorMessage = 'Failed to initialize payment. Please refresh the page.';
    } finally {
      this.stripeLoading = false;
    }
  }

  async initPaypalButtons() {
    this.paypalLoading = true;
    try {
      const paypal = await loadScript({
        clientId: environment.paypalClientId,
        currency: 'USD',
        intent: 'capture',
      });
      if (!paypal || !paypal.Buttons) {
        this.errorMessage = 'Failed to load PayPal. Please try again.';
        return;
      }
      this.paypalButtons = paypal.Buttons({
        style: { height: 55 },
        createOrder: async () => {
          if (!this.ngForm?.valid) {
            this.paypalFormInvalid = true;
            throw new Error('form-invalid');
          }
          this.paypalFormInvalid = false;

          const { orderId } = await this.submissionService.createPaypalOrder(this.selectedTier!.name);

          try {
            await this.submissionService.submit({
              firstName:             this.form.firstName,
              lastName:              this.form.lastName,
              email:                 this.form.email,
              country:               this.form.country,
              confirmImagesDates:    this.form.confirmDates,
              confirmAge:            this.form.confirmAge,
              confirmRules:          this.form.agreeRules,
              marketingConsent:      this.form.subscribeOffers,
              division:              this.division,
              tierName:              this.selectedTier!.name,
              paymentMethod:         'paypal',
              stripePaymentIntentId: '',
              paypalOrderId:         orderId,
              files:                 this.uploadSlots.map(s => s.file).filter((f): f is File => f !== null),
            });
          } catch (err: any) {
            this.modalMessage = err?.message || 'Something went wrong. Please try again.';
            throw new Error('submission-failed');
          }

          return orderId;
        },
        onApprove: async (data: any) => {
          await this.submissionService.capturePaypalOrder(data.orderID);
          this.submitted = true;
        },
        onError: (err: any) => {
          console.error('PayPal onError:', err);
          if ((err as Error)?.message === 'submission-failed') return;
          if (this.paypalFormInvalid) {
            this.paypalFormInvalid = false;
            this.errorMessage = 'Please complete all required fields before proceeding with PayPal.';
            return;
          }
          this.errorMessage = 'PayPal payment failed. Please try again.';
        },
      });
      this.paypalButtons.render('#paypal-button-container');
    } catch (err) {
      console.error('Failed to initialize PayPal:', err);
      this.errorMessage = 'Failed to initialize PayPal. Please try again.';
    } finally {
      this.paypalLoading = false;
    }
  }

  closeModal() {
    this.modalMessage = '';
  }

  onPaymentMethodChange() {
    if (this.paymentMethod === 'paypal' && !this.paypalButtons) {
      setTimeout(() => this.initPaypalButtons(), 0);
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

    if (this.paymentMethod === 'paypal') {
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    try {
      if (!this.stripe || !this.elements) {
        this.errorMessage = 'Payment not ready. Please wait a moment and try again.';
        return;
      }

      try {
        await this.submissionService.submit({
          firstName:             this.form.firstName,
          lastName:              this.form.lastName,
          email:                 this.form.email,
          country:               this.form.country,
          confirmImagesDates:    this.form.confirmDates,
          confirmAge:            this.form.confirmAge,
          confirmRules:          this.form.agreeRules,
          marketingConsent:      this.form.subscribeOffers,
          division:              this.division,
          tierName:              this.selectedTier.name,
          paymentMethod:         'stripe',
          stripePaymentIntentId: this.paymentIntentId,
          paypalOrderId:         '',
          files:                 this.uploadSlots.map(s => s.file).filter((f): f is File => f !== null),
        });
      } catch (err: any) {
        this.modalMessage = err?.message || 'Something went wrong. Please try again.';
        return;
      }

      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        redirect: 'if_required',
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: `${this.form.firstName} ${this.form.lastName}`.trim(),
              email: this.form.email,
            },
          },
        },
      });

      if (result.error) {
        this.modalMessage = result.error.message ?? 'Payment failed. Please try again.';
        return;
      }

      this.submitted = true;
    } catch (err) {
      console.error('Submission failed', err);
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.submitting = false;
    }
  }

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
