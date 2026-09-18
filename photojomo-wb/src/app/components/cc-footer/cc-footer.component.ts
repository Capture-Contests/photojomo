import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The Caribbean Connections footer, as built on the Connections home page:
 * logo, five link categories in columns, the ecosystem back-link, socials,
 * the copyright row and the legal notice.
 *
 * The home page's own copy of this is deep exported Figma markup that only
 * lays out inside its `#container` system, so this is a clean re-creation of
 * the same design for the Experience, About and Contact pages, which do not
 * carry that wrapper. The live/inactive split, the column layout and the
 * tablet and phone rules all match the home page.
 */
@Component({
  selector: 'app-cc-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cc-footer.component.html',
  styleUrls: ['./cc-footer.component.css'],
})
export class CcFooterComponent {
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
