import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contact-connections',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './contact-connections.component.html',
  styleUrls: ['./contact-connections.component.css'],
})
export class ContactConnectionsComponent {
  mediaBaseUrl = environment.mediaBaseUrl;
  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollToThriving(): void {
    if (typeof document !== 'undefined') {
      document
        .getElementById('thriving-community')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
