import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-africa',
  imports: [RouterLink],
  templateUrl: './capture-africa.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-africa.css'],
})
export class CaptureAfricaPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-africa';
}
