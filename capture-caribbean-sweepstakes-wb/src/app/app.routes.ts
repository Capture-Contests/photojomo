import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'info/rules', loadComponent: () => import('./pages/info/rules/rules').then(m => m.Rules) },
  { path: 'info/terms-of-use', loadComponent: () => import('./pages/info/terms-of-use/terms-of-use').then(m => m.TermsOfUse) },
  { path: 'info/privacy-policy', loadComponent: () => import('./pages/info/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy) },
  { path: '**', redirectTo: '' },
];
