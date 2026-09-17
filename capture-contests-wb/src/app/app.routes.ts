import { Routes } from '@angular/router';

/**
 * Every page is lazily loaded.
*
 * These were eager `component:` imports, which put all 13 page components
 * into main.js - 1.18MB raw that every visitor had to download, parse and
 * execute before the first route rendered, on a phone as much as a desktop.
 * loadComponent splits each page into its own chunk, so a visitor pays for
 * the page they asked for and nothing else.
 */
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.HomePage) },
  { path: 'the-experience', loadComponent: () => import('./pages/the-experience/the-experience').then((m) => m.TheExperiencePage) },
  { path: 'partner-with-us', loadComponent: () => import('./pages/partner-with-us/partner-with-us').then((m) => m.PartnerWithUsPage) },
  { path: 'partner-inquiry', loadComponent: () => import('./pages/partner-inquiry/partner-inquiry').then((m) => m.PartnerInquiryPage) },
  { path: 'creator-guidelines', loadComponent: () => import('./pages/creator-guidelines/creator-guidelines').then((m) => m.CreatorGuidelinesPage) },
  { path: 'capture-caribbean', loadComponent: () => import('./pages/capture-caribbean/capture-caribbean').then((m) => m.CaptureCaribbeanPage) },
  { path: 'capture-africa', loadComponent: () => import('./pages/capture-africa/capture-africa').then((m) => m.CaptureAfricaPage) },
  { path: 'capture-barbados', loadComponent: () => import('./pages/capture-barbados/capture-barbados').then((m) => m.CaptureBarbadosPage) },
  { path: 'capture-ghana', loadComponent: () => import('./pages/capture-ghana/capture-ghana').then((m) => m.CaptureGhanaPage) },
  { path: 'capture-guyana', loadComponent: () => import('./pages/capture-guyana/capture-guyana').then((m) => m.CaptureGuyanaPage) },
  { path: 'capture-jamaica', loadComponent: () => import('./pages/capture-jamaica/capture-jamaica').then((m) => m.CaptureJamaicaPage) },
  { path: 'capture-nigeria', loadComponent: () => import('./pages/capture-nigeria/capture-nigeria').then((m) => m.CaptureNigeriaPage) },
  { path: 'capture-saint-lucia', loadComponent: () => import('./pages/capture-saint-lucia/capture-saint-lucia').then((m) => m.CaptureSaintLuciaPage) },
  { path: '**', redirectTo: '' },
];
