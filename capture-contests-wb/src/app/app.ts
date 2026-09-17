import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CanonicalService } from './canonical';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  private readonly canonical = inject(CanonicalService);

  ngOnInit(): void {
    // Started from the root component so the first canonical is written for
    // the landing route, not only for later navigations.
    this.canonical.start();
  }
}
