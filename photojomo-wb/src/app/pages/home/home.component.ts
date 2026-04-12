import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { environment } from '../../../environments/environment';

interface HeroSlide {
  src: string;
  objectPosition?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {
  firstWaveUrl = environment.firstWaveUrl;

  heroSlides: HeroSlide[] = [
    { src: 'assets/images/beach_image.jpg', objectPosition: '72% center' },
    { src: 'assets/images/BG4.jpg' },
    { src: 'https://photojomo-dev-media.s3.amazonaws.com/images/iStock-1316997695.jpg' },
    { src: 'https://photojomo-dev-media.s3.amazonaws.com/images/iStock-1232115076.jpg' }
  ];

  currentIndex = 0;
  private autoPlayTimer: any;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  get currentSlide(): HeroSlide {
    return this.heroSlides[this.currentIndex];
  }

  get currentImage(): string {
    return this.currentSlide.src;
  }

  get currentObjectPosition(): string | null {
    return this.currentSlide.objectPosition ?? null;
  }

  prev(): void {
    this.currentIndex = (this.currentIndex - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.resetAutoPlay();
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.heroSlides.length;
    this.resetAutoPlay();
  }

  goTo(index: number): void {
    this.currentIndex = index;
    this.resetAutoPlay();
  }

  private startAutoPlay(): void {
    this.autoPlayTimer = setInterval(() => this.next(), 20000);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
  }

  private resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
