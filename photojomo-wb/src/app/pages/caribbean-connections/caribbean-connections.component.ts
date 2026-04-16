import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-caribbean-connections',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './caribbean-connections.component.html',
  styleUrls: ['./caribbean-connections.component.css'],
})
export class CaribbeanConnectionsComponent {
  readonly testimonials = [
    {
      avatar:
        'https://capturecaribbean.figma.site/_assets/v11/23b861c6b3079cef2ce4c4a94cf13f91475d17c2.png',
      avatarScale: 1,
      quote:
        '\u201CFinally, a space that celebrates our unique Caribbean perspective and connects us across islands.\u201D',
      name: 'Nadine Spencer',
      role: 'Visual Artist, Trinidad',
    },
    {
      avatar:
        'https://capturecaribbean.figma.site/_assets/v11/bdcefc9b9199e08c6bad895993cb33774c2c6934.png',
      avatarScale: 1,
      quote:
        '\u201CWow, this platform is exciting. A truly global platform.\u201D',
      name: 'Richard Thomas',
      role: 'Photographer, Jamaica',
    },
    {
      avatar: '/assets/images/iStock-1313422725.jpg',
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
