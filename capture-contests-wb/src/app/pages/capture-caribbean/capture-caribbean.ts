import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-caribbean',
  imports: [RouterLink],
  templateUrl: './capture-caribbean.html',
  styleUrls: ['../../../styles/family-region.css'],
})
export class CaptureCaribbeanPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-caribbean';
}
