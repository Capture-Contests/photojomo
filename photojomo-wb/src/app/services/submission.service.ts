import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  'general':           'cat-48f67277-313d-45af-8ef1-51c2be069cab',
  'emerging-creator':  'cat-70a8624d-4b6c-40e5-988f-1e919ad69c01',
  'college-creator':   'cat-edac2543-f68c-4f92-b30f-c04bbe77f676',
  'master-your-craft': 'cat-08455cbb-f706-4452-b7e4-dba8768f5aa4',
};

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

  getCategoryId(contestSlug: string): string {
    return CATEGORY_IDS[contestSlug] ?? CATEGORY_IDS['general'];
  }
}
