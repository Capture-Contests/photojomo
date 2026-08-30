import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-partner-with-us',
  imports: [RouterLink],
  templateUrl: './partner-with-us.html',
  styleUrls: ['../../../styles/family-contests.css', '../../../styles/partner-with-us.css'],
})
export class PartnerWithUsPage extends SiteChrome {
  protected readonly family = 'contests';
  protected readonly slug = 'partner-with-us';

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.whoCarousel();
  }

  /**
   * "Who We Partner With" runs its own carousel rather than the shared one.
   * The shared version stops after a whole number of card-steps, which leaves
   * the sixth panel bleeding off the right edge; this clamps the final step to
   * the track's end so it always lands inside the content column. Its markup
   * uses .pwc__* classes precisely so the shared carousel ignores it.
   */
  private whoCarousel(): void {
    const scope = this.root;

    const viewport = scope.querySelector<HTMLElement>('.pwc__viewport');
    if (!viewport) return;
    const track = viewport.querySelector<HTMLElement>('.pwc__track');
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const arrows = Array.from(scope.querySelectorAll<HTMLButtonElement>('.exp__arrow'));
    if (!cards.length) return;

    let index = 0;
    let drag: { x: number; y: number; base: number; moved: boolean; axis: string | null } | null =
      null;

    const step = () =>
      cards.length < 2 ? cards[0].offsetWidth : cards[1].offsetLeft - cards[0].offsetLeft;

    /** How far the track may travel: its right edge onto the content column's
     *  right edge, mirroring the viewport's left padding. */
    const maxShift = () => {
      const padLeft = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      return Math.max(0, padLeft * 2 + track.scrollWidth - viewport.clientWidth);
    };
    const maxIndex = () => {
      const s = step();
      return s > 0 ? Math.ceil(maxShift() / s) : 0;
    };
    const shiftFor = (i: number) => Math.min(i * step(), maxShift());
    const apply = (px: number) => {
      track.style.transform = `translate3d(${px}px,0,0)`;
    };

    const render = () => {
      index = Math.max(0, Math.min(index, maxIndex()));
      const px = shiftFor(index);
      apply(-px);
      arrows.forEach((b) => {
        const dir = Number(b.dataset['dir']);
        b.disabled = dir < 0 ? px <= 0.5 : px >= maxShift() - 0.5;
      });
    };

    arrows.forEach((b) => {
      this.on(b, 'click', () => {
        index += Number(b.dataset['dir']);
        render();
      });
    });

    viewport.setAttribute('tabindex', '0');
    this.on(viewport, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'ArrowRight') { index += 1; render(); e.preventDefault(); }
      if (k === 'ArrowLeft')  { index -= 1; render(); e.preventDefault(); }
    });

    this.on(viewport, 'pointerdown', (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType === 'mouse' && pe.button !== 0) return;
      drag = { x: pe.clientX, y: pe.clientY, base: -shiftFor(index), moved: false, axis: null };
      track.style.transition = 'none';
    });

    this.on(
      window,
      'pointermove',
      (e) => {
        if (!drag) return;
        const pe = e as PointerEvent;
        const dx = pe.clientX - drag.x;
        const dy = pe.clientY - drag.y;
        if (!drag.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        }
        if (drag.axis !== 'x') return;
        drag.moved = true;
        if (pe.cancelable) pe.preventDefault();
        apply(Math.min(0, Math.max(-maxShift(), drag.base + dx)));
      },
      { passive: false },
    );

    const endDrag = (e: Event) => {
      if (!drag) return;
      const dx = ((e as PointerEvent).clientX || 0) - drag.x;
      track.style.transition = '';
      if (drag.axis === 'x' && Math.abs(dx) > step() * 0.18) index += dx < 0 ? 1 : -1;
      render();
      drag = null;
    };
    this.on(window, 'pointerup', endDrag);
    this.on(window, 'pointercancel', endDrag);

    this.on(
      track,
      'click',
      (e) => {
        if (drag && drag.moved) { e.preventDefault(); e.stopPropagation(); }
      },
      { capture: true } as AddEventListenerOptions,
    );

    let rt: ReturnType<typeof setTimeout>;
    this.on(window, 'resize', () => {
      clearTimeout(rt);
      rt = setTimeout(render, 140);
    });

    render();
  }
}
