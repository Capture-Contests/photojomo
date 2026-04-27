import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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

interface TimelinePhase {
  years: string;
  title: string;
  description: string;
  image: string;
  icon: 'mail' | 'camera' | 'film' | 'trophy';
}

interface Finalist {
  name: string;
  avatar: string;
  role: string;
  quote: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  contests: ContestCard[] = [
    {
      title: 'General',
      image: 'images/card-general.png',
      description: 'Open to all photo enthusiasts. Whether you\'re a dedicated hobbyist or a seasoned artist, this is your stage to share your unique perspective.',
      price: '$25',
      award: '$500',
      tier: 'General Admission',
      route: '/contests/general',
    },
    {
      title: 'Emerging Creator',
      image: 'images/card-emerging.png',
      description: 'For young visual artists ages 18+. No professional experience required — just passion and creativity.',
      price: '$25',
      award: '$500',
      tier: 'General Admission',
      route: '/contests/emerging-creator',
    },
    {
      title: 'College Creator',
      image: 'images/card-college.png',
      description: 'For students currently enrolled in college. Open to all majors. Showcase your creativity and compete at the collegiate level.',
      price: '$25',
      award: '$500',
      tier: 'General Admission',
      route: '/contests/college-creator',
    },
    {
      title: 'Master Your Craft',
      image: 'images/card-master.png',
      description: 'For professional or advanced photographers and artists. Submissions are evaluated to the highest standards.',
      price: '$25',
      award: '$1000',
      tier: '',
      tierInfo: 'Includes a Golden Ticket Entry to the Main Event',
      route: '/contests/master-your-craft',
    },
  ];

  timeline: TimelinePhase[] = [
    {
      years: '2026 – 2027',
      title: 'Curated Invitations',
      description: 'A select group of global creators are invited.',
      image: 'images/tour-phase-1-2.png',
      icon: 'mail',
    },
    {
      years: '2027 – 2030',
      title: 'Creation',
      description: 'Artists capture the spirit and story of Saint Lucia.',
      image: 'images/tour-phase-3.png',
      icon: 'camera',
    },
    {
      years: '2031 – 2032',
      title: 'Submission',
      description: 'Final works are curated into a unified vision.',
      image: 'images/tour-phase-beach.png',
      icon: 'film',
    },
    {
      years: '2033 – 2034',
      title: 'Global Showcase',
      description: 'A premier exhibition launches, followed by an international tour.',
      image: 'images/tour-phase-4.png',
      icon: 'trophy',
    },
  ];

  legacyCarousel: { bg: string; logo: string; label: string }[] = [
    { bg: 'images/legacy-slide-beach.png',  logo: 'images/legacy-logo-beach.png',   label: 'Beach Resort & Spa'  },
    { bg: 'images/legacy-slide-marina.png', logo: 'images/legacy-logo-marina.png',  label: 'Marina Haven Hotel'  },
    { bg: 'images/legacy-bg.png',           logo: 'images/legacy-logo-resorts.png', label: 'Bay Gardens Resorts' },
    { bg: 'images/legacy-slide-inn.png',    logo: 'images/legacy-logo-inn.png',     label: 'Bay Gardens Inn'     },
    { bg: 'images/legacy-slide-hotel.png',  logo: 'images/legacy-logo-hotel.png',   label: 'Bay Gardens Hotel'   },
  ];

  legacyIndex = 0;
  private legacyTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.legacyTimer = setInterval(() => {
      this.legacyIndex = (this.legacyIndex + 1) % this.legacyCarousel.length;
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.legacyTimer) clearInterval(this.legacyTimer);
  }

  // 4-column staggered grid (short-tall ↔ tall-short alternating).
  globalStageColumns: { top: string; bottom: string; layout: 'short-tall' | 'tall-short' }[] = [
    { top: 'images/beach-2858720_1280.jpg',         bottom: 'images/IMG0008-1-Swim.jpg',                      layout: 'short-tall' },
    { top: 'images/iStock-464616573.jpg',           bottom: 'images/passion-fruit-daiquiri-906099_1280.jpg', layout: 'tall-short' },
    { top: 'images/JAM10401-scaled.jpg',            bottom: 'images/iStock-1400130744.jpg',                  layout: 'short-tall' },
    { top: 'images/IMG_0148.jpg',                   bottom: 'images/IMG0002.jpg',                            layout: 'tall-short' },
  ];

  voicesIntro = '“Saint Lucia demands more than postcards—it wants truth.”';

  finalists: Finalist[] = [
    {
      name: 'Alex Johnson',
      avatar: 'images/finalist-alex.png',
      role: 'Founder, Capture Caribbean & Curatorial Director',
      quote: 'Being selected as a finalist in the Caribbean Photo Contest is an incredible honor. This opportunity has allowed me to share my perspective with a global audience and connect more deeply with the culture and stories that inspire my work.',
    },
    {
      name: 'Amanya Brook',
      avatar: 'images/finalist-amanya.png',
      role: 'Artistic Director in Residence',
      quote: 'Becoming a finalist in the Caribbean Photo Contest means so much to me. It’s given me a platform to express my creativity, represent my voice, and be part of something that celebrates the beauty and spirit of the Caribbean.',
    },
  ];

  residencyArtist: Finalist = {
    name: 'Lisa Rao',
    avatar: 'images/residency-lisa.png',
    role: 'Founder, Capture Caribbean & Curatorial Director',
    quote: 'Winning the Artist-in-Residency has been an incredible journey. This experience has allowed me to live, create, and connect within the Caribbean in a way that has deeply influenced my work and expanded my creative vision.',
  };

  instagramPosts: string[] = [
    'images/ig-1.png',
    'images/ig-2.png',
    'images/ig-3.png',
    'images/ig-4.png',
  ];

}
