import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const CONTEST_ID = 'con-eea0aef2-df89-49ab-ac26-e05cb0ee6346';

const CATEGORY_IDS: Record<string, string> = {
  'general':          'cat-fd72cc65-2e4e-4ddd-8fb4-3baa81e6994d',
  'emerging-creator': 'cat-f09e8657-a3f7-4d62-bcd8-66e949aaaa99',
  'college-creator':  'cat-6348b22a-6e80-4dd6-a7fd-98baeca7521f',
  'professional':     'cat-ad124888-7c4b-480b-a4c4-cf2f39f33afa',
};

const TIER_IDS: Record<string, string> = {
  'Tier 1 - Explorer':   'tie-87b8ff19-7632-454b-a2f2-fafa473d930d',
  'Tier 2 - Enthusiast': 'tie-113874c3-37a1-437c-b961-b4eeec7c178b',
  'Tier 3 - Visionary':  'tie-708b7942-7538-47ca-b1ed-cc184757fe68',
  'Tier 4 - Master':     'tie-a5fd1747-4d05-4c8c-ac08-13671177c3de',
};

const TIER_PRICES: Record<string, number> = {
  'Tier 1 - Explorer':   25,
  'Tier 2 - Enthusiast': 45,
  'Tier 3 - Visionary':  65,
  'Tier 4 - Master':     95,
};

export interface SubmitParams {
  firstName:             string;
  lastName:              string;
  email:                 string;
  country:               string;
  confirmImagesDates:    boolean;
  confirmAge:            boolean;
  confirmRules:          boolean;
  marketingConsent:      boolean;
  division:              string;
  tierName:              string;
  paymentMethod:         'stripe' | 'paypal';
  stripePaymentIntentId: string;
  paypalOrderId:         string;
  files:                 File[];
}

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  constructor(private http: HttpClient) {}

  async createPaypalOrder(tierName: string): Promise<{ orderId: string }> {
    const amount = TIER_PRICES[tierName];
    if (!amount) throw new Error(`Unknown tier: ${tierName}`);

    return firstValueFrom(
      this.http.post<{ orderId: string }>(
        `${environment.apiBaseUrl}/paypal-orders`,
        { amount, currency: 'usd' }
      )
    );
  }

  async capturePaypalOrder(orderId: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${environment.apiBaseUrl}/paypal-orders/${orderId}/capture`,
        {}
      )
    );
  }

  async createPaymentIntent(tierName: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const amount = TIER_PRICES[tierName];
    if (!amount) throw new Error(`Unknown tier: ${tierName}`);

    return firstValueFrom(
      this.http.post<{ clientSecret: string; paymentIntentId: string }>(
        `${environment.apiBaseUrl}/payment-intents`,
        { amount, currency: 'usd' }
      )
    );
  }

  async submit(params: SubmitParams): Promise<void> {
    const contestCategoryId = CATEGORY_IDS[params.division];
    const contestTierId     = TIER_IDS[params.tierName];
    const amountPaid        = TIER_PRICES[params.tierName];

    if (!contestCategoryId) throw new Error(`Unknown division: ${params.division}`);
    if (!contestTierId)     throw new Error(`Unknown tier: ${params.tierName}`);

    // 1. Create contestant + submission
    const submission = await firstValueFrom(
      this.http.post<{ contestantId: string; submissionId: string }>(
        `${environment.apiBaseUrl}/submissions`,
        {
          firstName:             params.firstName,
          lastName:              params.lastName,
          email:                 params.email,
          country:               params.country,
          confirmImagesDates:    params.confirmImagesDates,
          confirmAge:            params.confirmAge,
          confirmRules:          params.confirmRules,
          marketingConsent:      params.marketingConsent,
          contestId:             CONTEST_ID,
          contestCategoryId,
          contestTierId,
          amountPaid,
          paymentMethod:         params.paymentMethod,
          stripePaymentIntentId: params.stripePaymentIntentId || undefined,
          paypalOrderId:         params.paypalOrderId || undefined,
        }
      ).pipe(
        catchError((err: HttpErrorResponse) => {
          const body = err.error ?? {};
          const raw: string = body.error ?? body.message ?? '';
          const message = raw.toLowerCase().includes('duplicate')
            ? 'You have already entered this division. Each contestant may only submit once per division.'
            : raw || 'Something went wrong. Please try again.';
          return throwError(() => new Error(message));
        })
      )
    );

    // 2. If files provided, get presigned URLs and upload
    if (params.files.length > 0) {
      const entryRes = await firstValueFrom(
        this.http.post<{ entries: { entryId: string; uploadUrl: string; key: string }[] }>(
          `${environment.apiBaseUrl}/contest-entries/presigned-urls`,
          {
            contestantId: submission.contestantId,
            submissionId: submission.submissionId,
            contestId:    CONTEST_ID,
            files: params.files.map(f => ({
              fileName:    f.name,
              contentType: f.type,
            })),
          }
        )
      );

      // 3. Upload each file directly to S3
      await Promise.all(
        entryRes.entries.map((entry, i) =>
          fetch(entry.uploadUrl, {
            method:  'PUT',
            body:    params.files[i],
            headers: { 'Content-Type': params.files[i].type },
          })
        )
      );
    }
  }
}
