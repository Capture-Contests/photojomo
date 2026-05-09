import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tier {
  id: string;
  name: string;
  price: number;
  maxImages: number;
  golden: boolean;
  sortOrder: number;
  benefits: string[];
}

const CATEGORY_IDS: Record<string, string> = {
  'general':          'cat-fd72cc65-2e4e-4ddd-8fb4-3baa81e6994d',
  'emerging-creator': 'cat-f09e8657-a3f7-4d62-bcd8-66e949aaaa99',
  'college-creator':  'cat-6348b22a-6e80-4dd6-a7fd-98baeca7521f',
  'professional':     'cat-ad124888-7c4b-480b-a4c4-cf2f39f33afa',
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
  tier:                  Tier;
  paymentMethod:         'stripe' | 'paypal';
  stripePaymentIntentId: string;
  paypalOrderId:         string;
  files:                 File[];
}

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  constructor(private http: HttpClient) {}

  async getTiers(): Promise<Tier[]> {
    const res = await firstValueFrom(
      this.http.get<{ tiers: Tier[] }>(
        `${environment.apiBaseUrl}/contests/${environment.contestId}/tiers`
      )
    );
    return res.tiers;
  }

  async createPaypalOrder(tierId: string): Promise<{ orderId: string }> {
    return firstValueFrom(
      this.http.post<{ orderId: string }>(
        `${environment.apiBaseUrl}/paypal-orders`,
        { contestTierId: tierId }
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

  async createPaymentIntent(tierId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return firstValueFrom(
      this.http.post<{ clientSecret: string; paymentIntentId: string }>(
        `${environment.apiBaseUrl}/payment-intents`,
        { contestTierId: tierId }
      )
    );
  }

  async submit(params: SubmitParams): Promise<void> {
    const contestCategoryId = CATEGORY_IDS[params.division];
    if (!contestCategoryId) throw new Error(`Unknown division: ${params.division}`);

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
          contestId:             environment.contestId,
          contestCategoryId,
          contestTierId:         params.tier.id,
          amountPaid:            params.tier.price,
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
            contestId:    environment.contestId,
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
