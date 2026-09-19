import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CcFooterComponent } from '../../../components/cc-footer/cc-footer.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

@Component({
  selector: 'app-cc-experience',
  standalone: true,
  imports: [RouterLink, CcFooterComponent, NavbarComponent],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.css'],
})
export class ExperienceComponent implements AfterViewInit, OnDestroy {
  /** The milestones strip. Its effects hold until it is scrolled into view. */
  @ViewChild('milestones') milestones?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const el = this.milestones?.nativeElement;
    if (!el) return;

    // Without an observer the strip would sit at its pre-roll opacity of 0,
    // so show it outright rather than animate it.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }

    // Fire once, when a good part of the strip is on screen — the four
    // milestones then run their stagger from CSS.
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
