import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-saint-lucia',
  imports: [RouterLink],
  templateUrl: './capture-saint-lucia.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-saint-lucia.css'],
})
export class CaptureSaintLuciaPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-saint-lucia';
}
