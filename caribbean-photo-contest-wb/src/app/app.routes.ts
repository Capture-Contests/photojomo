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
      { path: 'master-your-craft', loadComponent: () => import('./pages/contests/master-your-craft/master-your-craft').then(m => m.MasterYourCraft) },
    ],
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account/account').then(m => m.Account),
    children: [
      { path: 'register', loadComponent: () => import('./pages/account/register/register').then(m => m.Register) },
    ],
  },
  { path: '**', redirectTo: '' },
];
