import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * The canonical host. Every canonical URL is built from this, so switching
 * to www (or to a different domain) is a one-line change here rather than a
 * hunt through templates.
 */
export const SITE_ORIGIN = 'https://capturecontests.com';

/**
 * Keeps a single <link rel="canonical"> in <head> pointed at the current
 * route.
 *
 * This is a client-rendered SPA: index.html is served for every URL, so a
 * canonical baked into index.html would name the homepage on all 13 routes
 * and actively tell Google to drop the rest. It has to be rewritten as the
 * router navigates.
 *
 * The canonical is deliberately built from the routed path only — query
 * strings and fragments are dropped, so /capture-nigeria, /capture-nigeria#top
 * and /capture-nigeria?utm_source=x all resolve to one indexable URL.
 */
@Injectable({ providedIn: 'root' })
export class CanonicalService {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  start(): void {
    this.set(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.set(e.urlAfterRedirects));
  }

  private set(url: string): void {
    const path = url.split(/[?#]/)[0];
    // The homepage keeps its trailing slash; every other route has none, which
    // is the form the sitemap lists. The two must agree or they compete.
    const href = path === '/' ? `${SITE_ORIGIN}/` : SITE_ORIGIN + path;

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
