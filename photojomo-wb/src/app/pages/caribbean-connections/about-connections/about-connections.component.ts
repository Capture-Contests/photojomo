import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

@Component({
  selector: 'app-cc-about',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './about-connections.component.html',
  styleUrls: ['./about-connections.component.css'],
})
export class AboutConnectionsComponent {
  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
