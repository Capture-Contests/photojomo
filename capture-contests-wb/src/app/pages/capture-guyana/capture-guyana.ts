import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-guyana',
  imports: [RouterLink],
  templateUrl: './capture-guyana.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-guyana.css'],
})
export class CaptureGuyanaPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-guyana';
}
