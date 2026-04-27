import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './rules.html',
  styleUrls: ['../legal-modal.css'],
})
export class Rules implements OnInit {
  private readonly router = inject(Router);
  readonly returnState = this.resolveReturnState();

  ngOnInit() {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  close() {
    if (this.returnState.returnUrl) {
      this.router.navigateByUrl(this.returnState.returnUrl, { replaceUrl: true }).then(() => {
        requestAnimationFrame(() => window.scrollTo({ top: this.returnState.returnScrollY, left: 0, behavior: 'auto' }));
      });
      return;
    }
    this.router.navigateByUrl('/', { replaceUrl: true });
  }

  private resolveReturnState() {
    const state = history.state as { returnUrl?: string; returnScrollY?: number } | null;
    const saved = sessionStorage.getItem('legalModalReturnState');
    const parsed = saved ? JSON.parse(saved) as { returnUrl?: string; returnScrollY?: number } : null;
    const returnState = {
      returnUrl: state?.returnUrl ?? parsed?.returnUrl ?? '/',
      returnScrollY: state?.returnScrollY ?? parsed?.returnScrollY ?? 0,
    };
    sessionStorage.setItem('legalModalReturnState', JSON.stringify(returnState));
    return returnState;
  }
}
