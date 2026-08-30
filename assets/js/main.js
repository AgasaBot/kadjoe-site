/* KADJOE — interactions */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav');
  var overHero = nav && nav.classList.contains('over-hero');
  var lastY = 0;

  function onScroll() {
    var y = window.scrollY || 0;
    if (nav) {
      if (overHero) {
        nav.classList.toggle('solid', y > window.innerHeight * 0.72);
      } else {
        nav.classList.toggle('solid', y > 8);
      }
      if (y > 600 && y > lastY + 6 && !document.body.classList.contains('menu-open')) {
        nav.classList.add('hidden');
      } else if (y < lastY - 4 || y < 200) {
        nav.classList.remove('hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (nav && !overHero) nav.classList.add('solid');

  /* mobile menu */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mnav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* reveal on scroll — observer plus a sweep so fast jumps never leave elements hidden */
  var rvEls = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        e.target.classList.add('in'); io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 16% 0px' });
  rvEls.forEach(function (el) { io.observe(el); });
  function sweep() {
    var line = window.innerHeight * 1.14;
    rvEls = rvEls.filter(function (el) {
      if (el.classList.contains('in')) return false;
      if (el.getBoundingClientRect().top < line) { el.classList.add('in'); io.unobserve(el); return false; }
      return true;
    });
  }
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
  setTimeout(sweep, 60);
  setTimeout(sweep, 600);

  /* cross-page anchor jumps: re-assert the target position after load settles */
  function anchorFix() {
    var h = (location.hash || '').slice(1);
    if (!h) return;
    var t = document.getElementById(h);
    if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  if (location.hash) {
    setTimeout(anchorFix, 80);
    window.addEventListener('load', function () { setTimeout(anchorFix, 300); });
  }

  /* hero slideshow — slides beyond the first hydrate from data-src after first paint */
  var slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1) {
    var metaN = document.querySelector('.hero-meta .n');
    var metaL = document.querySelector('.hero-meta .loc');
    var dots = document.querySelectorAll('.hero-progress button');
    var cur = 0, t = null;
    function hydrate(slide) {
      var im = slide.querySelector('img');
      if (im && im.dataset.src && !im.src) im.src = im.dataset.src;
    }
    function show(i) {
      cur = (i + slides.length) % slides.length;
      hydrate(slides[cur]);
      hydrate(slides[(cur + 1) % slides.length]);
      slides.forEach(function (s, k) {
        s.classList.toggle('on', k === cur);
        if (k === cur && !reduceMotion) {
          var im = s.querySelector('img');
          im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
        }
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('on', k === cur);
        d.setAttribute('aria-current', k === cur ? 'true' : 'false');
      });
      if (metaN) metaN.textContent = slides[cur].dataset.name || '';
      if (metaL) metaL.textContent = slides[cur].dataset.loc || '';
    }
    function play() {
      if (t || reduceMotion) return;
      t = setInterval(function () { show(cur + 1); }, 7500);
    }
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () {
        if (t) { clearInterval(t); t = null; }
        show(k); play();
      });
    });
    show(0);
    if (reduceMotion) {
      slides.forEach(hydrate);
    } else {
      window.addEventListener('load', function () {
        setTimeout(function () { slides.forEach(hydrate); play(); }, 900);
      });
      setTimeout(play, 4000);
    }
  }

  /* portfolio filters */
  var fbtns = document.querySelectorAll('.filters button[data-f]');
  if (fbtns.length) {
    var cards = document.querySelectorAll('.pcard');
    var countEl = document.querySelector('.filters .count');
    function apply(f, push) {
      fbtns.forEach(function (b) {
        b.classList.toggle('on', b.dataset.f === f);
        b.setAttribute('aria-pressed', b.dataset.f === f ? 'true' : 'false');
      });
      var n = 0;
      cards.forEach(function (c) {
        var hit = (f === 'all') || (c.dataset.sector === f);
        c.classList.toggle('hid', !hit);
        if (hit) n++;
      });
      if (countEl) countEl.textContent = n + (n === 1 ? ' project' : ' projects');
      if (push) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
    }
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.f, true); });
    });
    function fromHash() {
      var h = (location.hash || '').replace('#', '');
      apply(['residential', 'fnb', 'retail', 'office', 'wellness'].indexOf(h) >= 0 ? h : 'all', false);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* lightbox — dialog semantics, focus trap, keyboard-openable tiles */
  var lbItems = Array.prototype.slice.call(document.querySelectorAll('.msn'));
  if (lbItems.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<button class="x">Close</button><button class="pv" aria-label="Previous image">←</button>' +
      '<img alt=""><button class="nx" aria-label="Next image">→</button><div class="c" aria-live="polite"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbC = lb.querySelector('.c'), idx = 0, opener = null;
    function open(i) {
      idx = (i + lbItems.length) % lbItems.length;
      lbImg.src = lbItems[idx].dataset.full;
      lbImg.alt = lbItems[idx].querySelector('img').alt || '';
      lbC.textContent = (idx + 1) + ' / ' + lbItems.length;
      if (!lb.classList.contains('open')) {
        opener = document.activeElement;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.x').focus();
      }
    }
    function close() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      if (opener && opener.focus) opener.focus();
    }
    lbItems.forEach(function (el, i) {
      el.addEventListener('click', function () { open(i); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', function (e) { e.stopPropagation(); open(idx - 1); });
    lb.querySelector('.nx').addEventListener('click', function (e) { e.stopPropagation(); open(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') open(idx - 1);
      else if (e.key === 'ArrowRight') open(idx + 1);
      else if (e.key === 'Tab') {
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
