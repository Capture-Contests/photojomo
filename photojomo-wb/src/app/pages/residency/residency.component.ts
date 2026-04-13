import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-residency',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './residency.component.html',
  styleUrls: ['./residency.component.css'],
})
export class ResidencyComponent implements AfterViewInit, OnDestroy {
  openProgramDetailIndex = 0;

  private ctaOriginalParent: HTMLElement | null = null;
  private ctaOriginalNextSibling: ChildNode | null = null;
  private ctaElement: HTMLElement | null = null;

  private readyOriginalParent: HTMLElement | null = null;
  private readyOriginalNextSibling: ChildNode | null = null;
  private readyElement: HTMLElement | null = null;

  constructor(private hostRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.applyMobileLayout();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.applyMobileLayout();
  }

  ngOnDestroy(): void {
    this.restoreCta();
    this.restoreReady();
  }

  private applyMobileLayout(): void {
    if (window.innerWidth <= 768) {
      this.moveCtaIntoContainer();
      this.moveReadyIntoContainer();
    } else {
      this.restoreCta();
      this.restoreReady();
    }
  }

  private moveReadyIntoContainer(): void {
    const host = this.hostRef.nativeElement;
    const container = host.querySelector<HTMLElement>('#container');
    if (!container) return;

    const ready = host.querySelector<HTMLElement>('.residency-ready-mobile');
    if (!ready) return;

    if (!this.readyOriginalParent) {
      this.readyOriginalParent = ready.parentElement;
      this.readyOriginalNextSibling = ready.nextSibling;
      this.readyElement = ready;
    }

    container.appendChild(ready);
  }

  private restoreReady(): void {
    if (!this.readyElement || !this.readyOriginalParent) return;
    if (this.readyElement.parentElement === this.readyOriginalParent) return;
    this.readyOriginalParent.insertBefore(
      this.readyElement,
      this.readyOriginalNextSibling,
    );
  }

  private moveCtaIntoContainer(): void {
    const host = this.hostRef.nativeElement;
    const container = host.querySelector<HTMLElement>('#container');
    if (!container) return;

    const cta = container.querySelector<HTMLElement>(
      '.residency-cta-section',
    );
    if (!cta) return;

    if (cta.parentElement === container) return;

    if (!this.ctaOriginalParent) {
      this.ctaOriginalParent = cta.parentElement;
      this.ctaOriginalNextSibling = cta.nextSibling;
      this.ctaElement = cta;
    }

    const outerFooter = container.querySelector<HTMLElement>(
      '.residency-mobile-footer--outer',
    );
    if (outerFooter) {
      container.insertBefore(cta, outerFooter);
    } else {
      container.appendChild(cta);
    }
  }

  private restoreCta(): void {
    if (!this.ctaElement || !this.ctaOriginalParent) return;
    if (this.ctaElement.parentElement === this.ctaOriginalParent) return;
    this.ctaOriginalParent.insertBefore(
      this.ctaElement,
      this.ctaOriginalNextSibling,
    );
  }

  readonly programDetails = [
    {
      question: 'What is the AIR Program?',
      answer:
        'The Capture Caribbean Artist in Residency (AIR) Program is the premier award given to the Content Creator of the Year from the Caribbean Photo Contest. It offers a fully funded creative residency in Saint Lucia to produce a signature body of work, engage with the culture, and gain international exposure.',
    },
    {
      question: 'What does the residency include?',
      answerLines: [
        '$15,000 USD Artist Grant',
        'Four-week luxury stay at Bay Gardens Resorts',
        'Airfare, transportation, and production support',
        'Creative workspace and curator guidance',
        'Fellows Showcase feature and global media visibility',
      ],
    },
    {
      question: 'Who is eligible?',
      answerLines: [
        'Contestants must be 18+ at time of entry (no minors).',
        'Must hold a valid passport and travel to Saint Lucia.',
        'Finalists must complete a portfolio and creative vision review.',
        'Program is reserved for serious photographers, filmmakers, and storytellers.',
      ],
    },
    {
      question: 'What’s expected of the Fellow?',
      answerLines: [
        'Complete a signature creative project during the residency.',
        'Participate in one community engagement activity.',
        'Create one sponsor-branded content piece.',
        'Deliver content assets and behind-the-scenes documentation.',
      ],
    },
    {
      question: 'How long is the residency?',
      answerLines: [
        'Tier | Duration | Description',
        'Tier 1 | 3 Weeks | Core program',
        'Tier 2 | 4 Weeks | Full residency (recommended)',
      ],
    },
    {
      question: 'How is the winner selected?',
      answerLines: [
        'Based on artistic excellence, originality, storytelling, and alignment with Capture Caribbean’s values.',
        'Finalists are reviewed by a panel of creative and cultural experts.',
      ],
    },
    {
      question: 'Content Guidelines',
      answerLines: [
        'Work must be original, created during the residency.',
        'Must respect local culture and laws.',
        'No vulgar, sexually explicit, hateful, violent, or exploitative content.',
        'Ethical representation and consent are required.',
      ],
    },
    {
      question: 'Why $15,000 Matters',
      answerLines: [
        'Positions AIR as a prestigious international residency.',
        'Attracts top-tier creators and drives strong sponsor visibility.',
        'Funds production of professional, high-quality creative work.',
        'Strengthens brand equity and cultural impact.',
      ],
    },
    {
      question: 'The Tri-Path Connection',
      answerLines: [
        'Sweepstakes builds awareness.',
        'Contest crowns the winner.',
        'Community extends the story.',
        'The residency is the red thread that connects all three platforms.',
      ],
    },
    {
      question: 'Key Dates',
      answerLines: [
        'Residency Launch: Early–Mid 2026',
        'Finalist Review: Following 2025 Contest',
        'Fellows Showcase: Hosted on CaribbeanConnections.world',
      ],
    },
  ];

  toggleProgramDetail(index: number): void {
    this.openProgramDetailIndex =
      this.openProgramDetailIndex === index ? -1 : index;
  }
}
