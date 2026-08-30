import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-nigeria',
  imports: [RouterLink],
  templateUrl: './capture-nigeria.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-nigeria.css'],
})
export class CaptureNigeriaPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-nigeria';
}
