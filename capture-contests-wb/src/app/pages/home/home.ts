import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['../../../styles/family-contests.css'],
})
export class HomePage extends SiteChrome {
  protected readonly family = 'contests';
  protected readonly slug = 'home';
}
