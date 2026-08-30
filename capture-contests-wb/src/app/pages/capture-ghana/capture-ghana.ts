import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-ghana',
  imports: [RouterLink],
  templateUrl: './capture-ghana.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-ghana.css'],
})
export class CaptureGhanaPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-ghana';
}
