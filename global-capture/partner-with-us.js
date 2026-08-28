/* Capture Contests — Partner With Us
   Its own carousel, kept separate from the shared one in global.js
   (which bails out because this page has no .exp__viewport).

   The difference: the shared carousel stops after a whole number of
   card-steps, which leaves the final card bleeding off the right edge.
   Here the last step is clamped to the track's end, so scrolling to the
   end always lands the sixth card fully inside the content column. */
(function () {
  var viewport = document.querySelector('.pwc__viewport');
  if (!viewport) return;
  var track = viewport.querySelector('.pwc__track');
  var cards = Array.prototype.slice.call(track.children);
  var arrows = Array.prototype.slice.call(document.querySelectorAll('.exp__arrow'));
  if (!cards.length) return;

  var index = 0;
  var drag = null;

  function step() {
    if (cards.length < 2) return cards[0].offsetWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;      // card width + gap
  }

  /* How far the track may travel: the point at which its right edge sits on
     the content column's right edge, mirroring the viewport's left padding. */
  function maxShift() {
    var padLeft = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    var shift = padLeft * 2 + track.scrollWidth - viewport.clientWidth;
    return Math.max(0, shift);
  }

  function maxIndex() {
    var s = step();
    return s > 0 ? Math.ceil(maxShift() / s) : 0;
  }

  function shiftFor(i) {
    return Math.min(i * step(), maxShift());
  }

  function apply(px) {
    track.style.transform = 'translate3d(' + px + 'px,0,0)';
  }

  function render() {
    index = Math.max(0, Math.min(index, maxIndex()));
    var px = shiftFor(index);
    apply(-px);
    arrows.forEach(function (b) {
      var dir = Number(b.dataset.dir);
      b.disabled = dir < 0 ? px <= 0.5 : px >= maxShift() - 0.5;
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
    drag = { x: e.clientX, y: e.clientY, base: -shiftFor(index), moved: false, axis: null };
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
    apply(Math.min(0, Math.max(-maxShift(), drag.base + dx)));
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
