import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Info } from '../info/info';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ContestCard {
  title: string;
  image: string;
  description: string;
  price: string;
  award: string;
  tier: string;
  tierInfo?: string;
  tierInfoHighlight?: string;
  route: string;
}

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

interface FaqCategory {
  category: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private deadline = new Date('2026-04-04T23:59:00-05:00');
  private readonly router = inject(Router);

  countdown = signal<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  contests: ContestCard[] = [
    {
      title: 'General',
      image: 'images/contest-general.png',
      description: 'Open to all photo enthusiasts. Whether you\'re a dedicated hobbyist or a seasoned artist, this is your stage to share your unique perspective.',
      price: '$25',
      award: '$500',
      tier: 'General Admission',
      route: '/contests/general',
    },
    {
      title: 'Emerging Creator',
      image: 'images/contest-emerging.png',
      description: 'For young visual artists ages 18+. No professional experience required — just passion and creativity.',
      price: '$25',
      award: '$500',
      tier: 'General Admission',
      route: '/contests/emerging-creator',
    },
    {
      title: 'College Creator',
      image: 'images/contest-college.png',
      description: 'For students currently enrolled in college. Open to all majors. Showcase your creativity and compete at the collegiate level.',
      price: '$25',
      award: '$500',
      tier: 'General Admission',
      route: '/contests/college-creator',
    },
    {
      title: 'Master Your Craft',
      image: 'images/contest-professional.png',
      description: 'For working photographers and artists who earn professionally or demonstrate advanced skill. Submissions are evaluated to the highest standards.',
      price: '$25',
      award: '$1000',
      tier: 'General Admission',
      tierInfo: 'Includes',
      tierInfoHighlight: 'Golden Ticket Entry',
      route: '/contests/professional',
    },
  ];

  founderBenefits = [
    'Priority consideration for future Invitationals, Exhibitions, and Residencies',
    'Help shape the creative foundation of the platform',
    'Early Official Contest Access',
    'Receive a digital badge of founding class membership',
    'Recognition as part of the inaugural Founding Creator Class',
  ];

  goldenTicketBenefits = [
    {
      title: 'BONUS MAIN EVENT ENTRY',
      desc: 'A complimentary second shot at the grand prize: A luxury Bay Gardens vacation.',
    },
    {
      title: 'INDUSTRY PUBLICATION',
      desc: 'Your work featured in the official CPC First Wave Lookbook, distributed to Caribbean tourism and media partners.',
    },
    {
      title: 'THE "PERFECT SHOT" FLEXIBILITY',
      desc: 'Swap or update your photo anytime before the deadline. Never worry about \'entry regret\' again.',
    },
  ];


  prizes = [
    { image: 'images/Container-3-1.svg', alt: 'Grand Prize' },
    { image: 'images/Container-2-1.svg', alt: 'Second Place' },
    { image: 'images/Container-1-1.svg', alt: 'Third Place' },
    { image: 'images/Container-4.svg', alt: 'Founding Creator Badge' },
  ];

  faqCategories: FaqCategory[] = [
    {
      category: 'General',
      items: [
        { question: 'What is Capture Caribbean – First Wave?', answer: 'Capture Caribbean – First Wave is the inaugural live launch of the Capture Caribbean platform. It is a 30-day global, skill-based creative challenge designed to identify the platform\'s Founding Creator Class while operationally launching the Capture Caribbean contest ecosystem ahead of its year-round programming.', open: false },
        { question: 'Is First Wave a contest or a platform test?', answer: 'First Wave is both. It is a bona fide, skill-based competition with real prizes awarded based solely on artistic and technical merit. As the inaugural launch, it also serves as the operational debut of the Capture Caribbean platform.', open: false },
        { question: 'Is First Wave a raffle, lottery, or sweepstakes?', answer: 'No. First Wave is a skill-based competition. Winners are selected by a panel of judges based on artistic and technical merit. No element of chance determines the outcome.', open: false },
        { question: 'Where can I find the Official Contest Rules?', answer: 'The Official Contest Rules are available at caribbeanphotocontests.com/rules. All participants are required to read and agree to the Official Rules before submitting an entry.', open: false },
        { question: 'Who is eligible to join the Founding Class Membership?', answer: 'Any photographer or visual artist who submits an eligible entry to the First Wave Challenge is considered for Founding Class Membership. Selection is based on creative merit and platform criteria.', open: false },
      ],
    },
    {
      category: 'Dates & Timing',
      items: [
        { question: 'When does the First Wave Challenge start and end?', answer: 'The Challenge Period begins on March 1, 2026 at 12:00 AM Eastern Standard Time (EST) and ends on April 4, 2026 at 11:59 PM EST. All entries must be uploaded before the submission deadline.', open: false },
        { question: 'Why is the First Wave Challenge limited to 30 days?', answer: 'The 30-day window is intentional. It creates urgency, ensures a focused inaugural cohort, and allows the platform to operationally launch with a defined Founding Class before opening year-round programming.', open: false },
      ],
    },
    {
      category: 'Eligibility & Entry',
      items: [
        { question: 'Who is eligible to participate?', answer: 'The First Wave Challenge is open to visual artists and photographers aged 18 and older worldwide, with limited exceptions. Employees and immediate family members of Capture Caribbean LLC and affiliated partners are not eligible.', open: false },
        { question: 'Are there any geographic restrictions?', answer: 'The challenge is open globally with limited geographic exclusions based on applicable law. Residents of countries subject to U.S. trade sanctions are not eligible. See Official Rules for full details.', open: false },
        { question: 'Are Canadian residents eligible?', answer: 'Yes, Canadian residents are eligible to participate. Canadian winners may be required to correctly answer a mathematical skill-testing question as required by Canadian law.', open: false },
        { question: 'What divisions are available in the First Wave Challenge?', answer: 'The First Wave Challenge includes four divisions: General, Emerging Creator (ages 18+, no professional experience required), College Creator (currently enrolled college students), and Master Your Craft (working professionals or advanced-skill photographers).', open: false },
        { question: 'How do I enter the First Wave Challenge?', answer: 'Visit www.caribbeanphotocontests.com, purchase a First Wave Access Pass for your chosen division, create your user account and profile using your legal name, then upload your eligible submission(s) before the April 4, 2026 deadline.', open: false },
      ],
    },
    {
      category: 'Fees, Prizes & Benefits',
      items: [
        { question: 'Is there a fee to enter?', answer: 'Entry requires the purchase of a First Wave Access Pass. The minimum entry fee is $25.00 USD. This fee supports platform access, contest administration, judging coordination, technical infrastructure, and prize fulfillment.', open: false },
        { question: 'Does paying a higher fee improve my chances of winning?', answer: 'No. All judging is based solely on artistic and technical merit. Higher-tier passes provide additional entries and benefits, but do not influence how submissions are evaluated.', open: false },
        { question: 'What is the Founding Creator Digital Badge?', answer: 'The Founding Creator Digital Badge is an official digital credential awarded to members of the inaugural Founding Class. It serves as a permanent mark of recognition and early membership in the Capture Caribbean platform.', open: false },
        { question: 'What is the Golden Ticket?', answer: 'The Golden Ticket is a premium pass upgrade that includes a bonus entry into the Grand Prize drawing, a feature in the official CPC First Wave Lookbook, and the ability to swap your submission before the deadline.', open: false },
        { question: 'What prizes are available?', answer: 'Grand Prize (1 Winner): A curated Saint Lucia travel experience for two (2), including five (5) nights at Bay Gardens Beach Resort, daily breakfast, one guided photography excursion, and round-trip airport transfers. Airfare is not included. Second Place: $1,500 USD cash prize. Third Place: $500 USD cash prize.', open: false },
        { question: 'Does the travel prize include airfare?', answer: 'No. The Grand Prize travel experience does not include airfare. The prize covers hotel accommodations, daily breakfast, one guided photography excursion, and round-trip airport transfers within Saint Lucia.', open: false },
        { question: 'Who is responsible for taxes on prizes?', answer: 'Prize winners are solely responsible for all applicable federal, state, provincial, and local taxes on any prize received. Capture Caribbean LLC will issue applicable tax documentation as required by law.', open: false },
      ],
    },
  ];

  ngOnInit() {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateCountdown() {
    const now = new Date();
    const diff = this.deadline.getTime() - now.getTime();
    if (diff <= 0) {
      this.countdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    this.countdown.set({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    });
  }

  scrollToContests() {
    document.getElementById('contests')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleFaq(catIndex: number, itemIndex: number) {
    this.faqCategories[catIndex].items[itemIndex].open = !this.faqCategories[catIndex].items[itemIndex].open;
  }

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
