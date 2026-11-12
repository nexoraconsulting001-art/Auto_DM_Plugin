(function () {
  var root = document.documentElement;
  var base = (document.currentScript && document.currentScript.src) || location.href;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  // Slower phones and data-saver users keep the design but skip the costly glass and drifting water.
  var lite = conn.saveData === true || (navigator.deviceMemory && navigator.deviceMemory < 3);

  root.classList.add('js');
  if (still) root.classList.add('still');
  if (lite) root.classList.add('lite');
  if (!still && !lite) root.classList.add('live');
  var moving = !still; // the scroll story and rising bubbles also run in lite mode

  function moveLens(row, btn) {
    var lens = row.querySelector('.lens');
    if (!lens || !btn) return;
    lens.style.width = btn.offsetWidth + 'px';
    lens.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
  }
  function select(row, btn) {
    [].forEach.call(row.querySelectorAll('button'), function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
    row.querySelector('.lens').classList.add('ready'); // glide only after the first placement
    moveLens(row, btn);
  }

  // The colour of the water follows the section in the middle of the screen.
  var sections = [].slice.call(document.querySelectorAll('main > section'));
  function setTone(t) { root.dataset.tone = t; }
  setTone(sections[0] ? sections[0].dataset.tone || 'mist' : 'mist');
  if ('IntersectionObserver' in window) {
    var toneWatch = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setTone(e.target.dataset.tone || 'mist'); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(function (s) { toneWatch.observe(s); });
  }

  // Scroll story: comment, DM, shop, order.
  var story = document.getElementById('story');
  var scenes = [].slice.call(document.querySelectorAll('.scene'));
  var caps = [].slice.call(document.querySelectorAll('.cap'));
  var stepRow = document.querySelector('.steps');
  var stepBtns = stepRow ? [].slice.call(stepRow.querySelectorAll('button')) : [];
  var run = document.querySelector('.run');
  var pin = document.querySelector('.pin');
  var at = 0;
  var pinned = !!run && moving && getComputedStyle(run).display !== 'none';

  function show(i) {
    if (i === at) return;
    scenes[0].parentNode.classList.add('moved');
    var old = scenes[at];
    old.classList.remove('on');
    old.classList.add('was');
    setTimeout(function () { old.classList.remove('was'); }, 620);
    at = i;
    scenes[i].classList.remove('was');
    scenes[i].classList.add('on');
    caps.forEach(function (c, n) { c.classList.toggle('on', n === i); });
    select(stepRow, stepBtns[i]);
  }
  if (scenes.length) {
    stepBtns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (!pinned) return show(i);
        var top = window.scrollY + run.getBoundingClientRect().top - pin.offsetHeight - stickyTop();
        window.scrollTo({ top: top + run.offsetHeight * (i + 0.5) / 4, behavior: still ? 'auto' : 'smooth' });
      });
    });
    moveLens(stepRow, stepBtns[0]);
  }
  function stickyTop() { return parseFloat(getComputedStyle(pin).top) || 0; }

  // Scroll-linked motion, one calculation per frame.
  var liquid = document.querySelector('.pool');
  var bubbles = [].slice.call(document.querySelectorAll('.wall span'));
  var wall = document.querySelector('.wall');
  var dripWrap = document.querySelector('.how-list');
  var drip = document.querySelector('.drip');
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (moving && liquid && !lite) liquid.style.transform = 'translate3d(' + (Math.sin(y / 700) * 28).toFixed(1) + 'px,' + (Math.cos(y / 900) * 40).toFixed(1) + 'px,0)';
    if (pin && caps.length) {
      var dockBtn = document.querySelector('.dock .btn');
      var limit = dockBtn && dockBtn.offsetParent ? dockBtn.getBoundingClientRect().top : vh;
      var note = document.querySelector('.stage-note').getBoundingClientRect();
      pin.classList.toggle('clear', note.bottom < limit);
    }
    if (pinned && scenes.length) {
      var r = run.getBoundingClientRect(), p = pin.getBoundingClientRect();
      var progress = 1 - (r.bottom - p.bottom) / r.height;
      show(Math.max(0, Math.min(3, Math.floor(progress * 4))));
    }
    if (moving && wall) {
      var w = wall.getBoundingClientRect();
      if (w.bottom > 0 && w.top < vh) {
        var t = (w.top + w.height / 2 - vh / 2) / vh;
        bubbles.forEach(function (b, i) {
          b.style.transform = 'translate3d(0,' + (t * (10 + (i % 4) * 16)).toFixed(1) + 'px,0)';
        });
      }
    }
    if (moving && drip && dripWrap) {
      var d = dripWrap.getBoundingClientRect();
      var fill = Math.max(0, Math.min(1, (vh * 0.62 - d.top) / d.height));
      drip.style.setProperty('--p', fill.toFixed(3));
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();

  // Five looks: swipe the cards, or tap a name.
  var looks = document.getElementById('looks');
  var lookRow = document.querySelector('.look-row');
  if (looks && lookRow) {
    var cards = [].slice.call(looks.querySelectorAll('.mock'));
    var lookBtns = [].slice.call(lookRow.querySelectorAll('button'));
    moveLens(lookRow, lookBtns[0]);
    lookBtns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        looks.scrollTo({ left: cards[i].offsetLeft - looks.offsetLeft - parseFloat(getComputedStyle(looks).paddingLeft), behavior: still ? 'auto' : 'smooth' });
        select(lookRow, b);
      });
    });
    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var btn = lookBtns[cards.indexOf(e.target)];
          select(lookRow, btn);
          if (lookRow.scrollWidth > lookRow.clientWidth) {
            lookRow.scrollTo({ left: btn.offsetLeft - (lookRow.clientWidth - btn.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
          }
        });
      }, { root: looks, threshold: 0.7 });
      cards.forEach(function (c) { seen.observe(c); });

      // The looks' fonts load only when someone reaches that section, to save data.
      var fonts = new IntersectionObserver(function (es) {
        if (!es.some(function (e) { return e.isIntersecting; })) return;
        fonts.disconnect();
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL('looks-fonts.css', base).href; // self-hosted, next to this script
        document.head.appendChild(link);
      }, { rootMargin: '500px' });
      fonts.observe(looks);
    }
  }

  // Keep each lens on its button when fonts load or the screen turns.
  function settle() {
    [].forEach.call(document.querySelectorAll('.lens-row'), function (row) {
      moveLens(row, row.querySelector('button[aria-selected="true"]'));
    });
  }
  window.addEventListener('resize', settle, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);

  // The thumb button steps aside when the real one is on screen.
  var dock = document.getElementById('dock');
  var start = document.getElementById('start');
  if (dock && start && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { dock.classList.toggle('away', es[0].isIntersecting); }, { threshold: 0.4 }).observe(start);
  }
})();
