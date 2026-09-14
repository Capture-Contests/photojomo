import { Component, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

/** Clears the fixed nav; the nav is only fixed at <=1180px. */
const OFFSET_MOBILE = 100;
const OFFSET_DESKTOP = 28;

@Component({
  selector: 'page-creator-guidelines',
  imports: [RouterLink],
  templateUrl: './creator-guidelines.html',
  styleUrls: ['../../../styles/family-contests.css', '../../../styles/creator-guidelines.css'],
})
export class CreatorGuidelinesPage extends SiteChrome {
  protected readonly family = 'contests';
  protected readonly slug = 'creator-guidelines';

  private readonly scroller = inject(ViewportScroller);

  /**
   * The jump links scroll through Angular's ViewportScroller (anchorScrolling
   * is enabled in app.config.ts), and it positions by getBoundingClientRect —
   * it does not honour the CSS `scroll-margin-top` on .guide__item. Without an
   * explicit offset a jumped-to heading lands at y=0, which puts it underneath
   * the nav at the widths where the nav is fixed.
   *
   * ViewportScroller is an app-wide singleton, so the previous offset is put
   * back on the way out rather than left changed for every other page.
   */
  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    const apply = () => this.scroller.setOffset([0, window.innerWidth <= 1180 ? OFFSET_MOBILE : OFFSET_DESKTOP]);
    apply();
    this.on(window, 'resize', apply);
    this.teardown.push(() => this.scroller.setOffset([0, 0]));

    this.jumpStrip();
  }

  /**
   * The arrow controls either side of the jump strip, and their disabled
   * state. The strip is a normal overflow-x scroller, so a trackpad swipe or
   * shift+wheel already moves it — but a plain mouse wheel scrolls the page,
   * and the scrollbar is hidden, which leaves a mouse with no way in.
   */
  private jumpStrip(): void {
    const row = this.root.querySelector<HTMLElement>('.jump__row');
    const arrows = Array.from(this.root.querySelectorAll<HTMLButtonElement>('.jump__arrow'));
    if (!row || arrows.length !== 2) return;

    /* Most of a screenful, so a click makes obvious progress without
       skipping past buttons unseen. */
    const step = () => Math.max(180, row.clientWidth * 0.72);

    arrows.forEach((btn) => {
      const dir = Number(btn.dataset['jump']) || 1;
      this.on(btn, 'click', () => row.scrollBy({ left: dir * step(), behavior: 'smooth' }));
    });

    const sync = () => {
      const max = row.scrollWidth - row.clientWidth;
      arrows.forEach((btn) => {
        const dir = Number(btn.dataset['jump']) || 1;
        // 1px of slack: fractional layout widths mean scrollLeft rarely lands
        // exactly on 0 or on max.
        btn.disabled = dir < 0 ? row.scrollLeft <= 1 : row.scrollLeft >= max - 1;
      });
    };

    this.on(row, 'scroll', sync);
    this.on(window, 'resize', sync);
    sync();
  }
}
