import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-caribbean-connections',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './caribbean-connections.component.html',
  styleUrls: ['./caribbean-connections.component.css'],
})
export class CaribbeanConnectionsComponent implements OnInit, AfterViewInit, OnDestroy {
  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      this.preloadAvatars();
    }
  }

  /** The "Voices of the Caribbean" YouTube embed. */
  @ViewChild('videoFrame') videoFrame?: ElementRef<HTMLIFrameElement>;
  private videoObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    const el = this.videoFrame?.nativeElement;
    if (!el) return;
    const src = el.dataset['src'];
    if (!src) return;

    // No observer (or no JS at all): attach it straight away rather than leave
    // the visitor with a video that never loads.
    if (typeof IntersectionObserver === 'undefined') {
      el.src = src;
      return;
    }
    this.videoObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.src = src;
        this.videoObserver?.disconnect();
      },
      { rootMargin: '400px 0px' }
    );
    this.videoObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.videoObserver?.disconnect();
  }

  /**
   * The carousel swaps `current.avatar` on one <img>, so an avatar that is not
   * in cache yet only paints once it has downloaded and decoded — which read as
   * the portrait lagging behind the name and quote. Fetching and decoding all
   * of them up front means every switch is already warm.
   */
  private preloadAvatars(): void {
    for (const t of this.testimonials) {
      const img = new Image();
      img.src = t.avatar;
      void img.decode?.().catch(() => undefined);
    }
  }

  readonly testimonials = [
    {
      avatar: '/assets/images/cc/cc-avatar-nadine.webp',
      avatarScale: 1,
      quote:
        '\u201CFinally, a space that celebrates our unique Caribbean perspective and connects us across islands.\u201D',
      name: 'Nadine Spencer',
      role: 'Visual Artist, Trinidad',
    },
    {
      avatar: '/assets/images/cc/cc-avatar-richard.webp',
      avatarScale: 1,
      quote:
        '\u201CWow, this platform is exciting. A truly global platform.\u201D',
      name: 'Richard Thomas',
      role: 'Photographer, Jamaica',
    },
    {
      avatar: '/assets/images/WhatsApp%20Image%202026-05-03%20at%205.46.03%20PM.jpeg',
      avatarScale: 1,
      quote:
        '\u201CI\u2019m an amateur photographer, but the advice and well wishes I\u2019ve received from the community shines like a diamond. Thank you!!\u201D',
      name: 'Stephanie Jansen',
      role: 'Filmmaker, Barbados',
    },
  ];

  currentSlide = 0;
  slideState: 'idle' | 'exit-next' | 'exit-prev' | 'enter-next' | 'enter-prev' = 'idle';
  private transitioning = false;
  private readonly fadeDurationMs = 600;

  get current() {
    return this.testimonials[this.currentSlide];
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollToThriving(): void {
    if (typeof document !== 'undefined') {
      document
        .getElementById('thriving-community')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  prev(event?: Event): void {
    event?.stopPropagation();
    this.go(-1);
  }

  next(event?: Event): void {
    event?.stopPropagation();
    this.go(1);
  }

  private go(delta: number): void {
    if (this.transitioning) return;
    this.transitioning = true;
    const dir = delta > 0 ? 'next' : 'prev';
    this.slideState = `exit-${dir}`;
    setTimeout(() => {
      this.currentSlide =
        (this.currentSlide + delta + this.testimonials.length) % this.testimonials.length;
      this.slideState = `enter-${dir}`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.slideState = 'idle';
          setTimeout(() => {
            this.transitioning = false;
          }, this.fadeDurationMs);
        });
      });
    }, this.fadeDurationMs);
  }
}
