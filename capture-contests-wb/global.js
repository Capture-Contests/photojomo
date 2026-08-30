/* Capture Contests — global platform landing page */
(function () {
  var nav = document.getElementById('nav');
  var burger = nav.querySelector('.nav__burger');
  var toTop = document.querySelector('.to-top');

  /* ---------- nav state on scroll ---------- */
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- mobile menu ---------- */
  function closeMobileGroups() {
    nav.querySelectorAll('.nav__mobile-group').forEach(function (g) {
      g.classList.remove('is-open');
      g.querySelector('.nav__mobile-toggle').setAttribute('aria-expanded', 'false');
    });
  }

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) closeMobileGroups();
  });

  nav.querySelectorAll('.nav__mobile-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var group = btn.parentElement;
      var open = !group.classList.contains('is-open');
      closeMobileGroups();
      if (open) {
        group.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  nav.querySelectorAll('.nav__mobile a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      closeMobileGroups();
    });
  });

  /* ---------- desktop dropdowns (click to toggle; hover handled in CSS) ---------- */
  function closeDrops() {
    nav.querySelectorAll('.nav__item--drop').forEach(function (d) {
      d.classList.remove('is-open');
      d.querySelector('.nav__trigger').setAttribute('aria-expanded', 'false');
    });
  }

  nav.querySelectorAll('.nav__trigger').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = btn.parentElement;
      var open = !item.classList.contains('is-open');
      closeDrops();
      if (open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', closeDrops);

  /* =========================================================
     Partner photographs — on mobile the two overlap, and tapping
     either one lifts it in front of the other.
     ========================================================= */
  (function () {
    var shots = Array.prototype.slice.call(document.querySelectorAll('.partner__shot'));
    if (shots.length < 2) return;
    var mq = window.matchMedia('(max-width: 860px)');

    function syncAffordance() {
      shots.forEach(function (s) {
        if (mq.matches) {
          s.setAttribute('tabindex', '0');
          s.setAttribute('role', 'button');
        } else {
          s.removeAttribute('tabindex');
          s.removeAttribute('role');
          s.classList.remove('is-front');
        }
      });
    }

    shots.forEach(function (s) {
      s.addEventListener('click', function () {
        if (!mq.matches) return;
        shots.forEach(function (o) { o.classList.remove('is-front'); });
        s.classList.add('is-front');
      });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.click(); }
      });
    });

    if (mq.addEventListener) mq.addEventListener('change', syncAffordance);
    else mq.addListener(syncAffordance);
    syncAffordance();
  })();

  /* =========================================================
     Creator Experiences — slide carousel
     Arrows, drag/swipe, and keyboard. Snaps to card boundaries
     and clamps so the track never scrolls past its last card.
     ========================================================= */
  (function () {
    var viewport = document.querySelector('.exp__viewport');
    if (!viewport) return;
    var track = viewport.querySelector('.exp__track');
    var cards = Array.prototype.slice.call(track.children);
    var arrows = Array.prototype.slice.call(document.querySelectorAll('.exp__arrow'));
    if (!cards.length) return;

    var index = 0;
    var drag = null;

    function step() {
      if (cards.length < 2) return cards[0].offsetWidth;
      return cards[1].offsetLeft - cards[0].offsetLeft;   // card width + gap
    }

    function maxIndex() {
      var visible = Math.max(1, Math.round(viewport.clientWidth / step()));
      return Math.max(0, cards.length - visible);
    }

    function apply(px) {
      track.style.transform = 'translate3d(' + px + 'px,0,0)';
    }

    function render() {
      index = Math.max(0, Math.min(index, maxIndex()));
      apply(-index * step());
      arrows.forEach(function (b) {
        var dir = Number(b.dataset.dir);
        b.disabled = dir < 0 ? index === 0 : index >= maxIndex();
      });
    }

    arrows.forEach(function (b) {
      b.addEventListener('click', function () {
        index += Number(b.dataset.dir);
        render();
      });
    });

    /* keyboard, once the carousel has focus */
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { index += 1; render(); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { index -= 1; render(); e.preventDefault(); }
    });

    /* pointer drag / touch swipe */
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, base: -index * step(), moved: false, axis: null };
      track.style.transition = 'none';
    });

    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;

      /* decide once whether this gesture is a horizontal swipe or a page scroll */
      if (!drag.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (drag.axis !== 'x') return;

      drag.moved = true;
      if (e.cancelable) e.preventDefault();
      apply(drag.base + dx);
    }, { passive: false });

    function endDrag(e) {
      if (!drag) return;
      var dx = (e.clientX || 0) - drag.x;
      track.style.transition = '';
      if (drag.axis === 'x' && Math.abs(dx) > step() * 0.18) {
        index += dx < 0 ? 1 : -1;
      }
      render();
      drag = null;
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* suppress the click that follows a drag */
    track.addEventListener('click', function (e) {
      if (drag && drag.moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(render, 140);
    });

    render();
  })();
})();
