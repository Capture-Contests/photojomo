import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';

/**
 * The behaviour that used to live in global.js / script.js.
 *
 * Two things change in moving it into Angular. First, the original scripts ran
 * once at the bottom of a document that was already parsed; here each page is
 * created and destroyed as you navigate, so everything binds in
 * ngAfterViewInit and is torn down again in ngOnDestroy — otherwise listeners
 * from a page you have left keep firing. Second, queries are scoped to the
 * component's own host rather than `document`, so two pages can never reach
 * into each other during a route transition.
 *
 * The feature set is the union of the two original files. global.js had the
 * carousel and the partner photographs on top of what script.js did, and every
 * block guards on its elements being present, so a regional page (which has
 * none of those hooks) behaves exactly as script.js did.
 */
@Directive()
export abstract class SiteChrome implements AfterViewInit, OnDestroy {
  protected abstract readonly family: string;
  protected abstract readonly slug: string;

  private readonly hostRef = inject(ElementRef<HTMLElement>);

  /** The component's own DOM subtree; queries are scoped to it. */
  protected get root(): HTMLElement {
    return this.hostRef.nativeElement as HTMLElement;
  }
  private teardown: Array<() => void> = [];

  ngAfterViewInit(): void {
    // Page stylesheets carry :root / body overrides that scoped component
    // styles cannot express; they hang off these two attributes.
    document.documentElement.dataset['family'] = this.family;
    document.documentElement.dataset['page'] = this.slug;
    const root = this.root;

    this.navChrome(root);
    this.partnerShots(root);
    this.carousel(root);
  }

  ngOnDestroy(): void {
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
  }

  /** Registers a listener and remembers how to remove it. */
  protected on<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, handler, opts);
    this.teardown.push(() => target.removeEventListener(type, handler, opts));
  }

  /* ---------- nav state on scroll, back-to-top, mobile menu, dropdowns ---------- */
  private navChrome(root: HTMLElement): void {
    const nav = root.querySelector<HTMLElement>('.nav');
    if (!nav) return;
    const burger = nav.querySelector<HTMLElement>('.nav__burger');
    const toTop = root.querySelector<HTMLElement>('.to-top');

    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
      if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    this.on(window, 'scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      this.on(toTop, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    const closeMobileGroups = () => {
      nav.querySelectorAll<HTMLElement>('.nav__mobile-group').forEach((g) => {
        g.classList.remove('is-open');
        g.querySelector('.nav__mobile-toggle')?.setAttribute('aria-expanded', 'false');
      });
    };

    if (burger) {
      this.on(burger, 'click', () => {
        const open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) closeMobileGroups();
      });
    }

    nav.querySelectorAll<HTMLElement>('.nav__mobile-toggle').forEach((btn) => {
      this.on(btn, 'click', (e) => {
        e.stopPropagation();
        const group = btn.parentElement!;
        const open = !group.classList.contains('is-open');
        closeMobileGroups();
        if (open) {
          group.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    nav.querySelectorAll<HTMLElement>('.nav__mobile a').forEach((a) => {
      this.on(a, 'click', () => {
        nav.classList.remove('is-open');
        burger?.setAttribute('aria-expanded', 'false');
        closeMobileGroups();
      });
    });

    const closeDrops = () => {
      nav.querySelectorAll<HTMLElement>('.nav__item--drop').forEach((d) => {
        d.classList.remove('is-open');
        d.querySelector('.nav__trigger')?.setAttribute('aria-expanded', 'false');
      });
    };
    nav.querySelectorAll<HTMLElement>('.nav__trigger').forEach((btn) => {
      this.on(btn, 'click', (e) => {
        e.stopPropagation();
        const item = btn.parentElement!;
        const open = !item.classList.contains('is-open');
        closeDrops();
        if (open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    this.on(document, 'click', closeDrops);
  }

  /* ---------- partner photographs: on mobile, tapping one lifts it in front ---------- */
  private partnerShots(root: HTMLElement): void {
    const shots = Array.from(root.querySelectorAll<HTMLElement>('.partner__shot'));
    if (shots.length < 2) return;
    const mq = window.matchMedia('(max-width: 860px)');

    const syncAffordance = () => {
      shots.forEach((s) => {
        if (mq.matches) {
          s.setAttribute('tabindex', '0');
          s.setAttribute('role', 'button');
        } else {
          s.removeAttribute('tabindex');
          s.removeAttribute('role');
          s.classList.remove('is-front');
        }
      });
    };

    shots.forEach((s) => {
      this.on(s, 'click', () => {
        if (!mq.matches) return;
        shots.forEach((o) => o.classList.remove('is-front'));
        s.classList.add('is-front');
      });
      this.on(s, 'keydown', (e) => {
        const k = (e as KeyboardEvent).key;
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          s.click();
        }
      });
    });

    mq.addEventListener('change', syncAffordance);
    this.teardown.push(() => mq.removeEventListener('change', syncAffordance));
    syncAffordance();
  }

  /* ---------- Creator Experiences carousel: arrows, drag/swipe, keyboard ---------- */
  private carousel(root: HTMLElement): void {
    const viewport = root.querySelector<HTMLElement>('.exp__viewport');
    if (!viewport) return;
    const track = viewport.querySelector<HTMLElement>('.exp__track');
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const arrows = Array.from(root.querySelectorAll<HTMLButtonElement>('.exp__arrow'));
    if (!cards.length) return;

    let index = 0;
    let drag: { x: number; y: number; base: number; moved: boolean; axis: string | null } | null =
      null;

    const step = () =>
      cards.length < 2 ? cards[0].offsetWidth : cards[1].offsetLeft - cards[0].offsetLeft;
    const maxIndex = () => {
      const visible = Math.max(1, Math.round(viewport.clientWidth / step()));
      return Math.max(0, cards.length - visible);
    };
    const apply = (px: number) => {
      track.style.transform = `translate3d(${px}px,0,0)`;
    };
    const render = () => {
      index = Math.max(0, Math.min(index, maxIndex()));
      apply(-index * step());
      arrows.forEach((b) => {
        const dir = Number(b.dataset['dir']);
        b.disabled = dir < 0 ? index === 0 : index >= maxIndex();
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
      if (k === 'ArrowRight') {
        index += 1;
        render();
        e.preventDefault();
      }
      if (k === 'ArrowLeft') {
        index -= 1;
        render();
        e.preventDefault();
      }
    });

    this.on(viewport, 'pointerdown', (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType === 'mouse' && pe.button !== 0) return;
      drag = { x: pe.clientX, y: pe.clientY, base: -index * step(), moved: false, axis: null };
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
        apply(drag.base + dx);
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
        if (drag && drag.moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true } as AddEventListenerOptions,
    );

    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(render, 140);
    };
    this.on(window, 'resize', onResize);
    this.teardown.push(() => clearTimeout(rt));

    render();
  }
}
