import { Routes } from '@angular/router';

import { HomePage } from './pages/home/home';
import { TheExperiencePage } from './pages/the-experience/the-experience';
import { PartnerWithUsPage } from './pages/partner-with-us/partner-with-us';
import { PartnerInquiryPage } from './pages/partner-inquiry/partner-inquiry';
import { CaptureCaribbeanPage } from './pages/capture-caribbean/capture-caribbean';
import { CaptureAfricaPage } from './pages/capture-africa/capture-africa';
import { CaptureBarbadosPage } from './pages/capture-barbados/capture-barbados';
import { CaptureGhanaPage } from './pages/capture-ghana/capture-ghana';
import { CaptureGuyanaPage } from './pages/capture-guyana/capture-guyana';
import { CaptureJamaicaPage } from './pages/capture-jamaica/capture-jamaica';
import { CaptureNigeriaPage } from './pages/capture-nigeria/capture-nigeria';
import { CaptureSaintLuciaPage } from './pages/capture-saint-lucia/capture-saint-lucia';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'the-experience', component: TheExperiencePage },
  { path: 'partner-with-us', component: PartnerWithUsPage },
  { path: 'partner-inquiry', component: PartnerInquiryPage },
  { path: 'capture-caribbean', component: CaptureCaribbeanPage },
  { path: 'capture-africa', component: CaptureAfricaPage },
  { path: 'capture-barbados', component: CaptureBarbadosPage },
  { path: 'capture-ghana', component: CaptureGhanaPage },
  { path: 'capture-guyana', component: CaptureGuyanaPage },
  { path: 'capture-jamaica', component: CaptureJamaicaPage },
  { path: 'capture-nigeria', component: CaptureNigeriaPage },
  { path: 'capture-saint-lucia', component: CaptureSaintLuciaPage },
  { path: '**', redirectTo: '' },
];
