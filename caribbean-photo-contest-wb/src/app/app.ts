import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubmissionService } from './core/submission.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    inject(SubmissionService).prefetchTiers();
  }
}
