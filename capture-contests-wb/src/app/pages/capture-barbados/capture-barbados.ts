import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-capture-barbados',
  imports: [RouterLink],
  templateUrl: './capture-barbados.html',
  styleUrls: ['../../../styles/family-region.css', '../../../styles/capture-barbados.css'],
})
export class CaptureBarbadosPage extends SiteChrome {
  protected readonly family = 'region';
  protected readonly slug = 'capture-barbados';
}
