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
  var early = document.getElementById('early');
  if (dock && early && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { dock.classList.toggle('away', es[0].isIntersecting); }, { threshold: 0.4 }).observe(early);
  }

  // Early access. With an endpoint set, the details go to Bhava's own lead capture. Without one,
  // WhatsApp or email opens with the details filled in, and nothing is stored by this website.
  var form = document.getElementById('ea-form');
  if (form) {
    var mode = form.getAttribute('data-mode');
    var wa = form.getAttribute('data-wa');
    var mail = form.getAttribute('data-email');
    var errBox = form.querySelector('.ea-error');
    var sendBtn = form.querySelector('button[type="submit"]');
    var done = document.getElementById('ea-done');
    var get = function (n) { return (form.elements[n].value || '').trim(); };
    var waLink = function (text) { return 'https://wa.me/' + wa + '?text=' + encodeURIComponent(text); };
    var mailLink = function (text) { return 'mailto:' + mail + '?subject=' + encodeURIComponent('Early access to Bhava') + '&body=' + encodeURIComponent(text); };

    var fail = function (msg, el, link) {
      errBox.textContent = msg;
      if (link) {
        var a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.label;
        errBox.appendChild(document.createTextNode(' '));
        errBox.appendChild(a);
      }
      errBox.hidden = false;
      [].forEach.call(form.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return null;
    };
    // Phones are kept in international format; ten digits on their own are taken as an Indian number.
    var phoneOf = function (raw) {
      var p = raw.replace(/[\s().-]/g, '');
      if (/^0\d{10}$/.test(p)) p = p.slice(1);
      if (/^\d{10}$/.test(p)) return '+91' + p;
      if (/^91\d{10}$/.test(p)) return '+' + p;
      return /^\+\d{8,15}$/.test(p) ? p : '';
    };
    var check = function () {
      var name = get('name'), rawPhone = get('phone'), email = get('email'), ig = get('instagram').replace(/^@+/, '');
      if (!name) return fail('Add your name.', form.elements.name);
      if (!rawPhone && !email) return fail('Add a phone number or an email.', form.elements.phone);
      var phone = rawPhone ? phoneOf(rawPhone) : '';
      if (rawPhone && !phone) return fail('Check the phone number: 10 digits, or start with + and the country code.', form.elements.phone);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Check the email address.', form.elements.email);
      if (!/^[A-Za-z0-9._]{1,30}$/.test(ig)) return fail('Add your Instagram handle: letters, numbers, dots or underscores.', form.elements.instagram);
      if (!form.elements.consent.checked) return fail('Tick the box so we may contact you.', form.elements.consent);
      errBox.hidden = true;
      return { name: name, phone: phone, email: email, instagram: ig, sells: get('sells') };
    };
    var message = function (d) {
      return ['Hi, I would like early access to Bhava.', 'Name: ' + d.name, d.phone && 'Phone: ' + d.phone, d.email && 'Email: ' + d.email,
        'Instagram: @' + d.instagram, d.sells && 'I sell: ' + d.sells, '', get('consentText')].filter(function (l) { return l !== '' && l !== undefined; }).join('\n');
    };
    var finish = function (text, link) {
      if (text) done.querySelector('.ea-done-text').textContent = text;
      if (link) {
        var p = document.createElement('p');
        var a = document.createElement('a');
        a.className = 'link';
        a.href = link.href;
        a.textContent = link.label;
        p.appendChild(a);
        done.appendChild(p);
      }
      form.hidden = true;
      done.hidden = false;
      done.focus();
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = check();
      if (!d) return;
      if (get('website')) return finish(); // the hidden field only bots fill in
      if (mode === 'whatsapp') {
        finish('WhatsApp should open now with your details. Press send there to reach us.', { href: waLink(message(d)), label: 'Open WhatsApp again' });
        location.href = waLink(message(d));
        return;
      }
      if (mode === 'email') {
        finish('Your email app should open now with your details. Press send there to reach us.', { href: mailLink(message(d)), label: 'Open the email again' });
        location.href = mailLink(message(d));
        return;
      }
      if (mode !== 'post') return fail('Early access sign-up is not open yet. Please check back soon.');
      sendBtn.disabled = true;
      var label = sendBtn.textContent;
      sendBtn.textContent = 'Sending…';
      var body = { name: d.name, phone: d.phone, email: d.email, instagram: d.instagram, sells: d.sells, consent: true,
        consentText: get('consentText'), consentVersion: get('consentVersion'), source: 'website', page: location.pathname, website: '' };
      fetch(form.getAttribute('data-endpoint'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          finish();
        })
        .catch(function () {
          sendBtn.disabled = false;
          sendBtn.textContent = label;
          var alt = wa ? { href: waLink(message(d)), label: 'Send it on WhatsApp instead' } : mail ? { href: mailLink(message(d)), label: 'Send it by email instead' } : null;
          fail('We could not send that just now. Please try again in a minute.', null, alt);
        });
    });
  }
})();
