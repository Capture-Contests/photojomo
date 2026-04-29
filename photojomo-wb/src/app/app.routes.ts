import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { GlobalTourComponent } from './pages/global-tour/global-tour.component';
import { ExhibitionComponent } from './pages/exhibition/exhibition.component';
import { CaribbeanConnectionsComponent } from './pages/caribbean-connections/caribbean-connections.component';
import { ExperienceComponent } from './pages/caribbean-connections/experience/experience.component';
import { AboutConnectionsComponent } from './pages/caribbean-connections/about-connections/about-connections.component';
import { ContactConnectionsComponent } from './pages/caribbean-connections/contact-connections/contact-connections.component';
import { ResidencyComponent } from './pages/residency/residency.component';
import { Residency2Component } from './pages/residency-2/residency-2.component';
import { FirstWaveChallengeComponent } from './pages/first-wave-challenge/first-wave-challenge.component';
import { SaintLuciaComponent } from './pages/saint-lucia/saint-lucia.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContestComponent } from './pages/contest/contest.component';
import { ContestEntryComponent } from './pages/contest-entry/contest-entry.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { SweepstakesComponent } from './pages/sweepstakes/sweepstakes.component';

export const routes: Routes = [
  { path: '',                                              title: 'Home',                  component: HomeComponent },
  { path: 'global-tour',                                   title: 'Global Tour',           component: GlobalTourComponent },
  { path: 'exhibition',                                    title: 'Exhibition',            component: ExhibitionComponent },
  { path: 'caribbean-connections',                         title: 'Caribbean Connections', component: CaribbeanConnectionsComponent },
  { path: 'caribbean-connections/experience',              title: 'Experience',            component: ExperienceComponent },
  { path: 'caribbean-connections/about-connections',       title: 'About Connections',     component: AboutConnectionsComponent },
  { path: 'caribbean-connections/contact-connections',     title: 'Contact Connections',   component: ContactConnectionsComponent },
  { path: 'residency',                                     title: 'Residency',             component: ResidencyComponent },
  { path: 'residency-2',                                   title: 'Residency 2',           component: Residency2Component },
  { path: 'first-wave-challenge',                          title: 'First Wave Challenge',  component: FirstWaveChallengeComponent },
  { path: 'saint-lucia',                                   title: 'Saint Lucia',           component: SaintLuciaComponent },
  { path: 'contact',                                       title: 'Contact',               component: ContactComponent },
  { path: 'about-us',                                      title: 'About Us',              component: AboutUsComponent },
  { path: 'contest',                                       title: 'Contest',               component: ContestComponent },
  { path: 'contest-entry/:id',                             title: 'Contest Entry',         component: ContestEntryComponent },
  { path: 'checkout/:contestId/:tierId',                   title: 'Checkout',              component: CheckoutComponent },
  { path: 'sweepstakes',                                   title: 'Sweepstakes',           component: SweepstakesComponent },
  { path: 'info/rules',                title: 'Rules',                loadComponent: () => import('./pages/info/rules/rules.component').then(m => m.RulesComponent) },
  { path: 'info/privacy-policy',       title: 'Privacy Policy',       loadComponent: () => import('./pages/info/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
  { path: 'info/terms-and-conditions', title: 'Terms and Conditions', loadComponent: () => import('./pages/info/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent) },
  { path: '**', redirectTo: '' },
];
