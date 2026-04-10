import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

interface NavItem {
  label: string;
  route: string;
  children?: { label: string; route: string }[];
}

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  mobileOpen = signal(false);
  activeDropdown = signal<string | null>(null);
  private readonly router = inject(Router);

  navItems: NavItem[] = [
    { label: 'Home', route: '/home' },
    {
      label: 'Contests',
      route: '/contests',
      children: [
        { label: 'General', route: '/contests/general' },
        { label: 'Emerging Creator', route: '/contests/emerging-creator' },
        { label: 'College Creator', route: '/contests/college-creator' },
        { label: 'Professional', route: '/contests/professional' },
        { label: 'Caribbean Only', route: '/contests/caribbean-only' },
        { label: 'All Contests', route: '/contests/all' },
      ],
    },
    { label: 'About', route: '/about' },
    { label: 'Prizes', route: '/prizes' },
    { label: 'Awards', route: '/awards' },
    {
      label: 'Info',
      route: '/info',
      children: [
        { label: 'Details', route: '/info/details' },
        { label: 'Rules', route: '/info/rules' },
        { label: 'FAQs', route: '/info/faqs' },
        { label: 'Terms & Conditions', route: '/info/terms-and-conditions' },
        { label: 'Privacy Policy', route: '/info/privacy-policy' },
        { label: 'Contact', route: '/info/contact' },
      ],
    },
    {
      label: 'Collaboration',
      route: '/collaboration',
      children: [
        { label: 'Partners', route: '/collaboration/partners' },
        { label: 'Sponsors', route: '/collaboration/sponsors' },
      ],
    },
    {
      label: 'Account',
      route: '/account',
      children: [
        { label: 'Register', route: '/account/register' },
      ],
    },
    { label: 'Early Bird Entry', route: '/early-bird-entry' },
  ];

  toggleMobile() {
    this.mobileOpen.update(v => !v);
  }

  toggleDropdown(label: string) {
    this.activeDropdown.update(current => current === label ? null : label);
  }

  closeMobile() {
    this.mobileOpen.set(false);
    this.activeDropdown.set(null);
  }

  legalModalState() {
    return {
      returnUrl: this.router.url,
      returnScrollY: window.scrollY,
    };
  }
}
