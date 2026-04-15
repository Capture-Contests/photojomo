import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const CONTEST_ID = 'con-f3a04fa9-f728-44af-a1f9-39f1b9a59776';

const CATEGORY_IDS: Record<string, string> = {
  'general':            'cat-48f67277-313d-45af-8ef1-51c2be069cab',
  'emerging-creator':   'cat-70a8624d-4b6c-40e5-988f-1e919ad69c01',
  'college-creator':    'cat-edac2543-f68c-4f92-b30f-c04bbe77f676',
  'master-your-craft':  'cat-08455cbb-f706-4452-b7e4-dba8768f5aa4',
};

const TIER_IDS: Record<string, string> = {
  'Tier 1 - Explorer':   'tie-5b9d6c78-1bdc-42b4-b32c-20a45f3581a7',
  'Tier 2 - Enthusiast': 'tie-1e1246fb-51b2-4f4b-a768-de4ca698a789',
  'Tier 3 - Visionary':  'tie-11932a50-ef36-4840-86fc-ef328ff77225',
  'Tier 4 - Master':     'tie-0376c878-1d85-4be5-ab24-945aedcdf353',
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
