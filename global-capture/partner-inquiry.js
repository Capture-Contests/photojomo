/* Capture Contests — Start a Partnership Conversation
   Four-step inquiry form: step paging, multi-select chips,
   light validation on the required fields, and the success state. */
(function () {
  var form = document.getElementById('inquiry');
  var done = document.getElementById('done');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var panel = form.closest('.inq__panel');
  var index = 0;

  /* ---------- paging ---------- */
  function show(next, moveFocus) {
    index = Math.max(0, Math.min(next, steps.length - 1));
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });

    /* keep the top of the step in view without yanking the whole page */
    if (panel) {
      var y = panel.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
    }

    if (moveFocus) {
      var first = steps[index].querySelector('input, select, textarea, .chip');
      if (first) first.focus({ preventScroll: true });
    }
  }

  /* ---------- validation (step 1 carries the only required fields) ---------- */
  function validate(step) {
    var bad = 0;
    step.querySelectorAll('[required]').forEach(function (el) {
      var field = el.closest('.field');
      var ok = el.checkValidity() && String(el.value).trim() !== '';
      if (field) field.classList.toggle('is-invalid', !ok);
      if (!ok) bad++;
    });
    var msg = step.querySelector('[data-error]');
    if (msg) msg.hidden = bad === 0;
    if (bad) {
      var firstBad = step.querySelector('.field.is-invalid input, .field.is-invalid select');
      if (firstBad) firstBad.focus();
    }
    return bad === 0;
  }

  /* clear the invalid mark as soon as the visitor fixes it */
  form.addEventListener('input', function (e) {
    var field = e.target.closest && e.target.closest('.field.is-invalid');
    if (field && e.target.checkValidity() && String(e.target.value).trim() !== '') {
      field.classList.remove('is-invalid');
    }
  });
  form.addEventListener('change', function (e) {
    var field = e.target.closest && e.target.closest('.field.is-invalid');
    if (field && e.target.value) field.classList.remove('is-invalid');
  });

  form.addEventListener('click', function (e) {
    var next = e.target.closest('[data-next]');
    var prev = e.target.closest('[data-prev]');
    var chip = e.target.closest('.chip');

    if (next) {
      if (!validate(steps[index])) return;
      show(index + 1, true);
    } else if (prev) {
      show(index - 1, true);
    } else if (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    }
  });

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(steps[0])) { show(0, true); return; }

    /* No endpoint is wired yet — collect the answers so whatever
       backend comes next has them in one shape. */
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.interests = pressed(steps[1]);
    data.goals = pressed(steps[3]);
    form.dataset.payload = JSON.stringify(data);

    form.hidden = true;
    if (done) {
      done.hidden = false;
      var y = done.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
      var h = done.querySelector('.done__title');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      startDoneMotion();
    }
  });

  /* =========================================================
     Success-state motion
     ========================================================= */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionStarted = false;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* One beat, every 4-5 seconds: the mark crouches, scales up, then drops and
     bounces itself out. Squash and stretch carry it -- it stretches on the way
     up, flattens on each landing, and the bounces decay. Between beats it
     simply rests. */
  function danceCheck(svg) {
    if (!svg || reduced.matches || !svg.animate) return;

    var STEP = 'cubic-bezier(.3, 0, .7, 1)';   // travel
    var LAND = 'cubic-bezier(.2, 0, .2, 1)';   // arrival, sharper

    function pose(y, sx, sy, ease) {
      return { transform: 'translateY(' + y + 'px) scale(' + sx + ',' + sy + ')', easing: ease };
    }

    (function beat() {
      svg.animate([
        pose(0, 1, 1, LAND),
        pose(2.5, 1.07, 0.90, STEP),        // crouch
        pose(-12, 0.94, 1.20, STEP),        // launch, stretched
        pose(-15, 1.32, 1.32, LAND),        // the scale-up, held at the top
        pose(0, 1.24, 0.82, STEP),          // land, flattened
        pose(-8, 0.97, 1.10, LAND),         // bounce
        pose(0, 1.12, 0.91, STEP),
        pose(-3, 1, 1.04, LAND),            // smaller bounce
        pose(0, 1.04, 0.98, STEP),
        pose(0, 1, 1, LAND)                 // settled
      ], { duration: 1250 });

      setTimeout(beat, rand(4000, 5000));   // one beat every 4-5s
    })();
  }

  /* A camera hops along the headline, and whichever word it is standing on
     lifts and gains weight. Positions come from the layout box (offsetLeft /
     offsetTop), never getBoundingClientRect, so the lit word's own scale can't
     drag the camera sideways -- and because they are read fresh on every hop,
     a resize or a re-wrapped second line is picked up for free. */
  function cameraHop(root) {
    if (!root || reduced.matches) return;
    var stage = root.querySelector('.done__stage');
    var cam = root.querySelector('.done__cam');
    var words = Array.prototype.slice.call(root.querySelectorAll('.done__title span'));
    if (!stage || !cam || !words.length || !cam.animate) return;

    function spot(i) {
      var w = words[i];
      return {
        x: w.offsetLeft + w.offsetWidth / 2 - cam.offsetWidth / 2,
        y: w.offsetTop - cam.offsetHeight - 3
      };
    }
    function at(p, sx, sy, rot) {
      return 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)' +
             ' rotate(' + (rot || 0).toFixed(1) + 'deg)' +
             ' scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
    }

    var idx = 0;
    var here = spot(0);
    cam.style.transform = at(here, 1, 1, 0);
    cam.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards' });
    words[0].classList.add('is-lit');

    /* Squash on touchdown, then settle -- the weight of the landing. */
    function land(p, dur, punch) {
      cam.animate([
        { transform: at(p, 1, 1, 0) },
        { transform: at(p, 1 + 0.20 * punch, 1 - 0.20 * punch, 0), offset: 0.26 },
        { transform: at(p, 1 - 0.06 * punch, 1 + 0.07 * punch, 0), offset: 0.58 },
        { transform: at(p, 1, 1, 0) }
      ], { duration: dur, easing: 'ease-out', fill: 'forwards' });
    }

    /* A real arc: linear in x, parabolic in y, tilting into the direction of
       travel and stretching slightly as it leaves the ground. */
    function arc(from, to, dur, liftScale) {
      var N = 22;
      var span = Math.abs(to.x - from.x);
      var lift = Math.min((14 + span * 0.10) * (liftScale || 1), 32);
      var tilt = (to.x >= from.x ? 1 : -1) * 13;
      var frames = [];
      for (var k = 0; k <= N; k++) {
        var t = k / N;
        var s = Math.sin(Math.PI * t);
        var p = {
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t - s * lift
        };
        var stretch = 1 + s * 0.10;
        frames.push({ transform: at(p, 1 / stretch, stretch, tilt * s), easing: 'linear' });
      }
      return cam.animate(frames, { duration: dur, fill: 'forwards' });
    }

    /* The closing phrase is a jump-jump: it touches "What's" and rebounds
       straight onto "Possible." with no dwell between, then holds for three
       seconds before starting over. `next` is the word being landed on. */
    var LAST = words.length - 1;          // "Possible."
    var PENULTIMATE = words.length - 2;   // "What's"

    function beatFor(next, wrap) {
      if (next === LAST)        return { fly: 215, lift: 0.7, dwell: 3000, land: 230, punch: 1.4 };
      if (next === PENULTIMATE) return { fly: 215, lift: 0.7, dwell: 0,    land: 130, punch: 0.7 };
      if (wrap)                 return { fly: 520, lift: 1,   dwell: 420,  land: 300, punch: 1 };
      return                           { fly: 380, lift: 1,   dwell: 420,  land: 300, punch: 1 };
    }

    function step() {
      var next = (idx + 1) % words.length;
      var wrap = next === 0;
      var b = beatFor(next, wrap);
      var from = spot(idx);
      var to = spot(next);

      /* Normally a word drops the moment the camera leaves it. On the
         jump-jump there is no dwell at all, so "What's" would be released in
         the same frame it was lit and never visibly react -- it keeps its
         highlight a beat longer while the camera is already in the air, which
         is what makes the pair read as two quick pops. */
      (function (leaving, hold) {
        if (hold) setTimeout(function () { leaving.classList.remove('is-lit'); }, hold);
        else leaving.classList.remove('is-lit');
      })(words[idx], idx === PENULTIMATE ? 300 : 0);

      var flight = arc(from, to, b.fly, b.lift);
      flight.onfinish = function () {
        idx = next;
        here = to;
        words[idx].classList.add('is-lit');
        land(here, b.land, b.punch);
        setTimeout(step, b.dwell);
      };
    }

    setTimeout(step, 620);
  }

  /* The button at the foot of the panel gives a shake every 3-4 seconds to
     draw the eye, then sits still. It skips a turn while the pointer or
     keyboard is on it, so it never squirms under someone about to click. */
  function wiggleButton(btn) {
    if (!btn || reduced.matches || !btn.animate) return;

    (function beat() {
      var busy = btn.matches(':hover') || btn.matches(':focus-visible');
      if (!busy) {
        btn.animate([
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-3.4deg) scale(1.035)', offset: 0.16 },
          { transform: 'rotate(3deg) scale(1.03)',     offset: 0.34 },
          { transform: 'rotate(-2.1deg) scale(1.02)',  offset: 0.52 },
          { transform: 'rotate(1.3deg) scale(1.012)',  offset: 0.69 },
          { transform: 'rotate(-0.6deg) scale(1.005)', offset: 0.85 },
          { transform: 'rotate(0deg) scale(1)' }
        ], { duration: 820, easing: 'ease-in-out' });
      }
      setTimeout(beat, rand(3000, 4000));
    })();
  }

  function startDoneMotion() {
    if (motionStarted || !done) return;
    motionStarted = true;
    danceCheck(done.querySelector('.done__check svg'));
    cameraHop(done);
    wiggleButton(done.querySelector('.btn'));
  }

  function pressed(step) {
    return Array.prototype.slice
      .call(step.querySelectorAll('.chip[aria-pressed="true"]'))
      .map(function (c) { return c.textContent.trim(); });
  }

  show(0, false);
})();
