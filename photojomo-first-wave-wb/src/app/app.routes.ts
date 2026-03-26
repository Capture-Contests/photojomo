import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  {
    path: 'contests',
    loadComponent: () => import('./pages/contests/contests').then(m => m.Contests),
    children: [
      { path: 'general', loadComponent: () => import('./pages/contests/general/general').then(m => m.General) },
      { path: 'emerging-creator', loadComponent: () => import('./pages/contests/emerging-creator/emerging-creator').then(m => m.EmergingCreator) },
      { path: 'college-creator', loadComponent: () => import('./pages/contests/college-creator/college-creator').then(m => m.CollegeCreator) },
      { path: 'professional', loadComponent: () => import('./pages/contests/professional/professional').then(m => m.Professional) },
      { path: 'caribbean-only', loadComponent: () => import('./pages/contests/caribbean-only/caribbean-only').then(m => m.CaribbeanOnly) },
      { path: 'all', loadComponent: () => import('./pages/contests/all-contests/all-contests').then(m => m.AllContests) },
    ],
  },
  { path: 'about', loadComponent: () => import('./pages/about/about').then(m => m.About) },
  { path: 'prizes', loadComponent: () => import('./pages/prizes/prizes').then(m => m.Prizes) },
  { path: 'awards', loadComponent: () => import('./pages/awards/awards').then(m => m.Awards) },
  {
    path: 'info',
    loadComponent: () => import('./pages/info/info').then(m => m.Info),
    children: [
      { path: 'details', loadComponent: () => import('./pages/info/details/details').then(m => m.Details) },
      { path: 'rules', loadComponent: () => import('./pages/info/rules/rules').then(m => m.Rules) },
      { path: 'faqs', loadComponent: () => import('./pages/info/faqs/faqs').then(m => m.Faqs) },
      { path: 'terms-and-conditions', loadComponent: () => import('./pages/info/terms-and-conditions/terms-and-conditions').then(m => m.TermsAndConditions) },
      { path: 'privacy-policy', loadComponent: () => import('./pages/info/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy) },
      { path: 'contact', loadComponent: () => import('./pages/info/contact/contact').then(m => m.Contact) },
    ],
  },
  {
    path: 'collaboration',
    loadComponent: () => import('./pages/collaboration/collaboration').then(m => m.Collaboration),
    children: [
      { path: 'partners', loadComponent: () => import('./pages/collaboration/partners/partners').then(m => m.Partners) },
      { path: 'sponsors', loadComponent: () => import('./pages/collaboration/sponsors/sponsors').then(m => m.Sponsors) },
    ],
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account/account').then(m => m.Account),
    children: [
      { path: 'register', loadComponent: () => import('./pages/account/register/register').then(m => m.Register) },
    ],
  },
  { path: 'early-bird-entry', loadComponent: () => import('./pages/early-bird-entry/early-bird-entry').then(m => m.EarlyBirdEntry) },
  { path: '**', redirectTo: '' },
];
