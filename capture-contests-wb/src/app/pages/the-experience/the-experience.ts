import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-the-experience',
  imports: [RouterLink],
  templateUrl: './the-experience.html',
  styleUrls: ['../../../styles/family-contests.css', '../../../styles/the-experience.css'],
})
export class TheExperiencePage extends SiteChrome {
  protected readonly family = 'contests';
  protected readonly slug = 'the-experience';
}
