import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteChrome } from '../../site-chrome';

@Component({
  selector: 'page-partner-inquiry',
  imports: [RouterLink],
  templateUrl: './partner-inquiry.html',
  styleUrls: ['../../../styles/family-contests.css', '../../../styles/partner-inquiry.css'],
})
export class PartnerInquiryPage extends SiteChrome {
  protected readonly family = 'contests';
  protected readonly slug = 'partner-inquiry';

  private index = 0;
  private steps: HTMLElement[] = [];
  private motionStarted = false;
  private timers: Array<ReturnType<typeof setTimeout>> = [];

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.inquiryForm();
  }

  override ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    super.ngOnDestroy();
  }

  /** setTimeout that is cancelled when the page is left. */
  private later(fn: () => void, ms: number): void {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
  }

  private rand(a: number, b: number): number {
    return a + Math.random() * (b - a);
  }

  private inquiryForm(): void {
    const root = this.root;
    const form = root.querySelector<HTMLFormElement>('#inquiry');
    const done = root.querySelector<HTMLElement>('#done');
    if (!form) return;

    this.steps = Array.from(form.querySelectorAll<HTMLElement>('.step'));
    const panel = form.closest('.inq__panel') as HTMLElement | null;

    const show = (next: number, moveFocus: boolean) => {
      this.index = Math.max(0, Math.min(next, this.steps.length - 1));
      this.steps.forEach((s, i) => s.classList.toggle('is-active', i === this.index));

      /* keep the top of the step in view without yanking the whole page */
      if (panel) {
        const y = panel.getBoundingClientRect().top + window.scrollY - 90;
        if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
      }
      if (moveFocus) {
        this.steps[this.index]
          .querySelector<HTMLElement>('input, select, textarea, .chip')
          ?.focus({ preventScroll: true });
      }
    };

    /* step 1 carries the only required fields */
    const validate = (step: HTMLElement): boolean => {
      let bad = 0;
      step.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[required]').forEach((el) => {
        const field = el.closest('.field');
        const ok = el.checkValidity() && String(el.value).trim() !== '';
        field?.classList.toggle('is-invalid', !ok);
        if (!ok) bad++;
      });
      const msg = step.querySelector<HTMLElement>('[data-error]');
      if (msg) msg.hidden = bad === 0;
      if (bad) {
        step
          .querySelector<HTMLElement>('.field.is-invalid input, .field.is-invalid select')
          ?.focus();
      }
      return bad === 0;
    };

    /* clear the invalid mark as soon as the visitor fixes it */
    const clearInvalid = (e: Event) => {
      const t = e.target as HTMLInputElement;
      const field = t.closest?.('.field.is-invalid');
      if (field && t.checkValidity?.() && String(t.value).trim() !== '') {
        field.classList.remove('is-invalid');
      }
    };
    this.on(form, 'input', clearInvalid);
    this.on(form, 'change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.closest?.('.field.is-invalid') && t.value) {
        t.closest('.field.is-invalid')!.classList.remove('is-invalid');
      }
    });

    this.on(form, 'click', (e) => {
      const t = e.target as HTMLElement;
      const next = t.closest('[data-next]');
      const prev = t.closest('[data-prev]');
      const chip = t.closest('.chip');
      if (next) {
        if (!validate(this.steps[this.index])) return;
        show(this.index + 1, true);
      } else if (prev) {
        show(this.index - 1, true);
      } else if (chip) {
        chip.setAttribute(
          'aria-pressed',
          chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true',
        );
      }
    });

    const pressed = (step: HTMLElement) =>
      Array.from(step.querySelectorAll('.chip[aria-pressed="true"]')).map((c) =>
        (c.textContent || '').trim(),
      );

    this.on(form, 'submit', (e) => {
      e.preventDefault();
      if (!validate(this.steps[0])) {
        show(0, true);
        return;
      }

      /* No endpoint is wired yet — collect the answers in one shape so
         whatever backend comes next has them. */
      const data: Record<string, unknown> = {};
      new FormData(form).forEach((v, k) => (data[k] = v));
      data['interests'] = pressed(this.steps[1]);
      data['goals'] = pressed(this.steps[3]);
      form.dataset['payload'] = JSON.stringify(data);

      form.hidden = true;
      if (done) {
        done.hidden = false;
        window.scrollTo({
          top: done.getBoundingClientRect().top + window.scrollY - 120,
          behavior: 'smooth',
        });
        const h = done.querySelector<HTMLElement>('.done__title');
        if (h) {
          h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
        }
        this.startDoneMotion(done);
      }
    });

    show(0, false);
  }

  /* =========================================================
     Success-state motion
     ========================================================= */
  private startDoneMotion(done: HTMLElement): void {
    if (this.motionStarted) return;
    this.motionStarted = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.arrowBeat(done.querySelector<SVGElement>('.done__check svg'));
    this.cameraHop(done);
    this.wiggleButton(done.querySelector<HTMLElement>('.btn'));
  }

  /** One beat every 4-5s: crouch, scale up, then bounce itself out. */
  private arrowBeat(svg: SVGElement | null): void {
    if (!svg || !svg.animate) return;
    const STEP = 'cubic-bezier(.3, 0, .7, 1)';
    const LAND = 'cubic-bezier(.2, 0, .2, 1)';
    const pose = (y: number, sx: number, sy: number, ease: string) => ({
      transform: `translateY(${y}px) scale(${sx},${sy})`,
      easing: ease,
    });

    const beat = () => {
      svg.animate(
        [
          pose(0, 1, 1, LAND),
          pose(2.5, 1.07, 0.9, STEP), // crouch
          pose(-12, 0.94, 1.2, STEP), // launch, stretched
          pose(-15, 1.32, 1.32, LAND), // the scale-up, held at the top
          pose(0, 1.24, 0.82, STEP), // land, flattened
          pose(-8, 0.97, 1.1, LAND), // bounce
          pose(0, 1.12, 0.91, STEP),
          pose(-3, 1, 1.04, LAND), // smaller bounce
          pose(0, 1.04, 0.98, STEP),
          pose(0, 1, 1, LAND), // settled
        ],
        { duration: 1250 },
      );
      this.later(beat, this.rand(4000, 5000));
    };
    beat();
  }

  /**
   * A camera hops the headline; the word it lands on lifts and gains weight.
   * Positions come from the layout box, never getBoundingClientRect, so the
   * lit word's own scale cannot drag the camera sideways — and reading them
   * fresh each hop handles a resize or a re-wrapped second line for free.
   */
  private cameraHop(root: HTMLElement): void {
    const stage = root.querySelector<HTMLElement>('.done__stage');
    const cam = root.querySelector<HTMLElement>('.done__cam');
    const words = Array.from(root.querySelectorAll<HTMLElement>('.done__title span'));
    if (!stage || !cam || !words.length || !cam.animate) return;

    const spot = (i: number) => ({
      x: words[i].offsetLeft + words[i].offsetWidth / 2 - cam.offsetWidth / 2,
      y: words[i].offsetTop - cam.offsetHeight - 3,
    });
    const at = (p: { x: number; y: number }, sx: number, sy: number, rot = 0) =>
      `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;

    let idx = 0;
    cam.style.transform = at(spot(0), 1, 1);
    cam.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards' });
    words[0].classList.add('is-lit');

    const land = (p: { x: number; y: number }, dur: number, punch: number) =>
      cam.animate(
        [
          { transform: at(p, 1, 1) },
          { transform: at(p, 1 + 0.2 * punch, 1 - 0.2 * punch), offset: 0.26 },
          { transform: at(p, 1 - 0.06 * punch, 1 + 0.07 * punch), offset: 0.58 },
          { transform: at(p, 1, 1) },
        ],
        { duration: dur, easing: 'ease-out', fill: 'forwards' },
      );

    const arc = (from: { x: number; y: number }, to: { x: number; y: number }, dur: number, liftScale: number) => {
      const N = 22;
      const span = Math.abs(to.x - from.x);
      const lift = Math.min((14 + span * 0.1) * liftScale, 32);
      const tilt = (to.x >= from.x ? 1 : -1) * 13;
      const frames = [];
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const s = Math.sin(Math.PI * t);
        const p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - s * lift };
        const stretch = 1 + s * 0.1;
        frames.push({ transform: at(p, 1 / stretch, stretch, tilt * s), easing: 'linear' });
      }
      return cam.animate(frames, { duration: dur, fill: 'forwards' });
    };

    /* the closing phrase is a jump-jump: it touches "What's" and rebounds
       straight onto "Possible.", then holds for three seconds */
    const LAST = words.length - 1;
    const PENULTIMATE = words.length - 2;
    const beatFor = (next: number, wrap: boolean) => {
      if (next === LAST) return { fly: 215, lift: 0.7, dwell: 3000, land: 230, punch: 1.4 };
      if (next === PENULTIMATE) return { fly: 215, lift: 0.7, dwell: 0, land: 130, punch: 0.7 };
      if (wrap) return { fly: 520, lift: 1, dwell: 420, land: 300, punch: 1 };
      return { fly: 380, lift: 1, dwell: 420, land: 300, punch: 1 };
    };

    const step = () => {
      const next = (idx + 1) % words.length;
      const wrap = next === 0;
      const b = beatFor(next, wrap);
      const from = spot(idx);
      const to = spot(next);

      /* On the jump-jump there is no dwell, so "What's" would be released in
         the same frame it was lit and never visibly react. Holding it a beat
         longer while the camera is airborne is what makes the pair read as
         two quick pops. */
      const leaving = words[idx];
      const hold = idx === PENULTIMATE ? 300 : 0;
      if (hold) this.later(() => leaving.classList.remove('is-lit'), hold);
      else leaving.classList.remove('is-lit');

      const flight = arc(from, to, b.fly, b.lift);
      flight.onfinish = () => {
        idx = next;
        words[idx].classList.add('is-lit');
        land(to, b.land, b.punch);
        this.later(step, b.dwell);
      };
    };

    this.later(step, 620);
  }

  /** A shake every 3-4s, skipped while the pointer or keyboard is on it. */
  private wiggleButton(btn: HTMLElement | null): void {
    if (!btn || !btn.animate) return;
    const beat = () => {
      const busy = btn.matches(':hover') || btn.matches(':focus-visible');
      if (!busy) {
        btn.animate(
          [
            { transform: 'rotate(0deg) scale(1)' },
            { transform: 'rotate(-3.4deg) scale(1.035)', offset: 0.16 },
            { transform: 'rotate(3deg) scale(1.03)', offset: 0.34 },
            { transform: 'rotate(-2.1deg) scale(1.02)', offset: 0.52 },
            { transform: 'rotate(1.3deg) scale(1.012)', offset: 0.69 },
            { transform: 'rotate(-0.6deg) scale(1.005)', offset: 0.85 },
            { transform: 'rotate(0deg) scale(1)' },
          ],
          { duration: 820, easing: 'ease-in-out' },
        );
      }
      this.later(beat, this.rand(3000, 4000));
    };
    beat();
  }
}
