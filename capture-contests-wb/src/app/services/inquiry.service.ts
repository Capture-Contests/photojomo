import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../environments/environment';

/** Everything the Partner Inquiry form collects. */
export interface InquiryPayload {
  /** Which form this came from. The endpoint picks the auto-responder by this. */
  form: 'partner-inquiry';
  name: string;
  organization?: string;
  role?: string;
  email: string;
  phone?: string;
  website?: string;
  country?: string;
  opportunity?: string;
  interests?: string[];
  goals?: string[];
  /** Honeypot. Always empty from a person; only a bot fills it in. */
  fax?: string;
  /** When the form was rendered. The endpoint drops sub-3s completions. */
  ccStart?: number;
}

export interface InquiryResult {
  ok: boolean;
  /** Present when the send failed, for logging — never shown raw to the visitor. */
  error?: string;
}

/**
 * Sends Partner Inquiry submissions.
 *
 * The component deliberately knows nothing about where the enquiry goes: the
 * target is environment.inquiryEndpoint, so moving between a Pages Function,
 * the API Gateway backend, or anything else is a config change rather than a
 * code change. That decision is still open, which is exactly why it is behind
 * this seam.
 */
@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly http = inject(HttpClient);

  /** POST the enquiry. Never throws — the caller gets ok:false instead. */
  send(payload: InquiryPayload): Observable<InquiryResult> {
    const url = environment.inquiryEndpoint.startsWith('http')
      ? environment.inquiryEndpoint
      : `${environment.apiBaseUrl}${environment.inquiryEndpoint}`;

    return this.http.post<InquiryResult>(url, payload).pipe(
      // A 200 with a body that does not say ok:true is still a failure: the
      // endpoint answers 200 to bot-filtered submissions on purpose.
      map((r) => ({ ok: r?.ok === true })),
      catchError((e: unknown) => {
        const status = (e as { status?: number })?.status;
        return of({ ok: false, error: status ? `http ${status}` : 'network' });
      }),
    );
  }
}
