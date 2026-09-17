import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { DEFAULT_META, ROUTE_META } from './seo-routes';

/**
 * The canonical host. Every canonical and og:url is built from this, so
 * switching to www (or to a different domain) is a one-line change here
 * rather than a hunt through templates.
 */
export const SITE_ORIGIN = 'https://capturecontests.com';

/**
 * Social preview card, absolute - relative paths are ignored by crawlers.
 * Deliberately a JPEG, not webp: LinkedIn and some other link unfurlers still
 * fail to render webp og:image, and 1200x630 is the size they all expect.
 */
const OG_IMAGE = `${SITE_ORIGIN}/images/og-card.jpg`;

/**
 * Keeps <title>, the description, the canonical link and the Open Graph tags
 * pointed at the current route.
 *
 * This is a client-rendered SPA: index.html is served for every URL, so
 * anything baked into index.html describes the homepage on all 13 routes —
 * a static canonical would tell Google to drop twelve of them, and a static
 * title would make every search result identical. It all has to be rewritten
 * as the router navigates.
 *
 * Canonicals are built from the routed path only; query strings and fragments
 * are dropped, so /capture-nigeria, /capture-nigeria#top and
 * /capture-nigeria?utm_source=x all resolve to one indexable URL.
 */
@Injectable({ providedIn: 'root' })
export class CanonicalService {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  start(): void {
    this.apply(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.apply(e.urlAfterRedirects));
  }

  private apply(url: string): void {
    const path = url.split(/[?#]/)[0];
    // The homepage keeps its trailing slash; every other route has none, which
    // is the form the sitemap lists. The two must agree or they compete.
    const href = path === '/' ? `${SITE_ORIGIN}/` : SITE_ORIGIN + path;

    const key = path.replace(/^\/+/, '').replace(/\/+$/, '');
    const m = ROUTE_META[key] ?? DEFAULT_META;

    this.title.setTitle(m.title);
    this.meta.updateTag({ name: 'description', content: m.description });

    this.setCanonical(href);

    // og:title/description mirror the page metadata so a shared link reads the
    // same as the search result. Twitter reads the og:* tags via card=summary.
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Capture Contests' });
    this.meta.updateTag({ property: 'og:title', content: m.title });
    this.meta.updateTag({ property: 'og:description', content: m.description });
    this.meta.updateTag({ property: 'og:url', content: href });
    this.meta.updateTag({ property: 'og:image', content: OG_IMAGE });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
  }

  private setCanonical(href: string): void {
    const head = this.doc.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
