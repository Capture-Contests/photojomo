import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-jamaica',
  imports: [RouterLink],
  templateUrl: './capture-jamaica.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-jamaica.css'],
})
export class CaptureJamaicaPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-jamaica';
}
