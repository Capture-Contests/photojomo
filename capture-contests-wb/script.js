/* Capture Caribbean — Global Capture landing page */
(function () {
  var nav = document.getElementById('nav');
  var burger = nav.querySelector('.nav__burger');

  var toTop = document.querySelector('.to-top');

  // Logo fades white -> gold once the page has scrolled off the top
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 600);
  }

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) closeMobileGroups();
  });

  function closeMobileGroups() {
    nav.querySelectorAll('.nav__mobile-group').forEach(function (g) {
      g.classList.remove('is-open');
      g.querySelector('.nav__mobile-toggle').setAttribute('aria-expanded', 'false');
    });
  }

  // Mobile accordions — same sub-links as the desktop dropdowns
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

  // Desktop dropdowns — click to toggle (hover is handled in CSS)
  nav.querySelectorAll('.nav__trigger').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = btn.parentElement;
      var open = !item.classList.contains('is-open');
      nav.querySelectorAll('.nav__item--drop').forEach(function (d) {
        d.classList.remove('is-open');
        d.querySelector('.nav__trigger').setAttribute('aria-expanded', 'false');
      });
      if (open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', function () {
    nav.querySelectorAll('.nav__item--drop').forEach(function (d) {
      d.classList.remove('is-open');
      d.querySelector('.nav__trigger').setAttribute('aria-expanded', 'false');
    });
  });
})();
