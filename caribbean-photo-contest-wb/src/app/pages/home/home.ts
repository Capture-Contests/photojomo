import { Component } from '@angular/core';
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

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
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
      route: '/contests/master-your-craft',
    },
  ];
}
