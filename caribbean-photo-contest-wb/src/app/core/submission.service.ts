import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tier {
  id:        string;
  name:      string;
  price:     number;
  maxImages: number;
  golden:    boolean;
  sortOrder: number;
  benefits:  string[];
}

const CATEGORY_IDS: Record<string, string> = {
  'general':            'cat-48f67277-313d-45af-8ef1-51c2be069cab',
  'emerging-creator':   'cat-70a8624d-4b6c-40e5-988f-1e919ad69c01',
  'college-creator':    'cat-edac2543-f68c-4f92-b30f-c04bbe77f676',
  'master-your-craft':  'cat-08455cbb-f706-4452-b7e4-dba8768f5aa4',
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
  tierId:                string;
  amountPaid:            number;
  paymentMethod:         'stripe' | 'paypal';
  stripePaymentIntentId: string;
  paypalOrderId:         string;
  files:                 File[];
}

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private tiersCache: Promise<Tier[]> | null = null;

  constructor(private http: HttpClient) {}

  getTiers(): Promise<Tier[]> {
    if (!this.tiersCache) {
      this.tiersCache = firstValueFrom(
        this.http.get<{ tiers: Tier[] }>(
          `${environment.apiBaseUrl}/contests/${environment.contestId}/tiers`
        )
      ).then(res => res.tiers);
    }
    return this.tiersCache;
  }

  prefetchTiers(): void {
    this.getTiers().catch(() => {});
  }

  async createPaypalOrder(tierId: string): Promise<{ orderId: string }> {
    return firstValueFrom(
      this.http.post<{ orderId: string }>(
        `${environment.apiBaseUrl}/paypal-orders`,
        { contestTierId: tierId, currency: 'usd' }
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
        { contestTierId: tierId, currency: 'usd' }
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
          contestTierId:         params.tierId,
          amountPaid:            params.amountPaid,
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
