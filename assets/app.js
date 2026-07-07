/* MILLIONS KART — shared animation engine (GSAP + ScrollTrigger) */
(function () {
  document.documentElement.classList.remove('no-js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  var preloaderKilled = false;
  function killPreloader() {
    if (preloaderKilled) return;
    preloaderKilled = true;
    var pre = document.querySelector('.preloader');
    if (!pre) return startIntro();
    pre.classList.add('is-done');

    // full show only on first page this session; quick fade when navigating between pages
    var quick = false;
    try {
      quick = sessionStorage.getItem('mk_seen') === '1';
      sessionStorage.setItem('mk_seen', '1');
    } catch (e) {}

    var hold = reduceMotion ? 150 : (quick ? 380 : 1250);
    var bar = pre.querySelector('.preloader-bar i');
    var count = pre.querySelector('.preloader-count');
    var tick = null;
    if (!quick && count) {
      var steps = ['BUILDING', 'BRANDS', 'MILLIONS', 'LOVE'];
      var i = 0;
      tick = setInterval(function () { if (steps[i]) count.textContent = steps[i]; i++; }, 300);
    }
    if (bar) {
      bar.style.transition = 'width ' + (hold / 1000) + 's cubic-bezier(.65,0,.35,1)';
      requestAnimationFrame(function () { bar.style.width = '100%'; });
    }
    setTimeout(function () {
      if (tick) clearInterval(tick);
      pre.style.transition = 'transform .65s cubic-bezier(.75,0,.25,1)';
      pre.style.transform = 'translateY(-100%)';
      setTimeout(function () { pre.remove(); }, 700);
      startIntro();
    }, hold);
  }

  // safety net: never let the preloader trap the page (slow/blocked CDN, tab restored, etc.)
  setTimeout(function () {
    if (!preloaderKilled) { revealAllFallback(); killPreloader(); }
  }, 5000);
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { // restored from back/forward cache
      var pre = document.querySelector('.preloader');
      if (pre) pre.remove();
      revealAllFallback();
    }
  });

  /* ---------- Hero intro ---------- */
  function startIntro() {
    if (!window.gsap) return revealAllFallback();
    var words = document.querySelectorAll('.hero .wr > span');
    if (words.length) {
      gsap.to(words, {
        y: 0, duration: 1.05, ease: 'power4.out',
        stagger: 0.07, delay: 0.1
      });
    }
    gsap.utils.toArray('.hero [data-intro]').forEach(function (el, idx) {
      gsap.fromTo(el, { y: 34, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.55 + idx * 0.14
      });
    });
    gsap.utils.toArray('.chip-float').forEach(function (chip, idx) {
      gsap.fromTo(chip, { y: 60, opacity: 0, rotate: idx % 2 ? 6 : -6 }, {
        y: 0, opacity: 1, rotate: idx % 2 ? 3 : -3, duration: 1.2, ease: 'elastic.out(1, .6)', delay: 0.9 + idx * 0.18
      });
      // gentle endless float
      gsap.to(chip, {
        y: idx % 2 ? -14 : 14, duration: 2.6 + idx * 0.4, yoyo: true, repeat: -1,
        ease: 'sine.inOut', delay: 2 + idx * 0.2
      });
    });
  }

  function revealAllFallback() {
    document.querySelectorAll('[data-reveal],[data-reveal-l],[data-reveal-r],[data-scale]').forEach(function (el) {
      el.style.opacity = 1; el.style.transform = 'none';
    });
    document.querySelectorAll('.wr > span').forEach(function (s) { s.style.transform = 'none'; });
  }

  /* ---------- Split hero headline into word spans ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var html = el.innerHTML.trim();
    // split preserving <br> and existing spans with classes
    var parts = html.split(/(<br\s*\/?>)/g);
    var out = parts.map(function (p) {
      if (/^<br/.test(p)) return p;
      var tmp = document.createElement('div');
      tmp.innerHTML = p;
      var words = [];
      tmp.childNodes.forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
            words.push('<span class="wr"><span>' + w + '</span></span>');
          });
        } else if (node.nodeType === 1) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) {
            words.push('<span class="wr"><span class="' + node.className + '">' + w + '</span></span>');
          });
        }
      });
      return words.join(' ');
    }).join('');
    el.innerHTML = out;
  });

  /* ---------- Custom cursor ---------- */
  var cur = document.querySelector('.cursor'), ring = document.querySelector('.cursor-ring');
  if (cur && ring && matchMedia('(hover:hover)').matches) {
    var rx = 0, ry = 0, tx = 0, ty = 0;
    addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cur.style.left = tx + 'px'; cur.style.top = ty + 'px';
    });
    (function lerp() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(lerp);
    })();
    document.querySelectorAll('a, button, .role, .value-row').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cur.classList.add('is-hot'); ring.classList.add('is-hot'); });
      el.addEventListener('mouseleave', function () { cur.classList.remove('is-hot'); ring.classList.remove('is-hot'); });
    });
  }

  /* ---------- Nav scroll state ---------- */
  var nav = document.querySelector('.nav');
  addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('is-scrolled', scrollY > 40);
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.nav-burger');
  var scrim = document.querySelector('.nav-scrim');
  function closeMenu() { nav.classList.remove('open'); document.body.classList.remove('menu-open'); document.body.style.overflow = ''; }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    if (scrim) scrim.addEventListener('click', closeMenu);
  }

  /* ---------- Wait for GSAP ---------- */
  function whenReady(fn) {
    if (window.gsap && window.ScrollTrigger) return fn();
    var n = 0, t = setInterval(function () {
      if (window.gsap && window.ScrollTrigger) { clearInterval(t); fn(); }
      else if (++n > 40) { clearInterval(t); revealAllFallback(); killPreloader(); }
    }, 100);
  }

  whenReady(function () {
    gsap.registerPlugin(ScrollTrigger);
    if (reduceMotion) { revealAllFallback(); killPreloader(); return; }

    /* scroll reveals */
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
        delay: (parseFloat(el.dataset.delay) || 0)
      });
    });
    gsap.utils.toArray('[data-reveal-l]').forEach(function (el) {
      gsap.to(el, { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%' } });
    });
    gsap.utils.toArray('[data-reveal-r]').forEach(function (el) {
      gsap.to(el, { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%' } });
    });
    gsap.utils.toArray('[data-scale]').forEach(function (el) {
      gsap.to(el, { opacity: 1, scale: 1, duration: 1.1, ease: 'elastic.out(1,.75)', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    /* stagger groups */
    gsap.utils.toArray('[data-stagger]').forEach(function (group) {
      var kids = group.children;
      gsap.fromTo(kids, { y: 54, opacity: 0 }, {
        y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .12,
        scrollTrigger: { trigger: group, start: 'top 82%' }
      });
    });

    /* counters */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count);
      var dec = el.dataset.count.indexOf('.') > -1 ? 1 : 0;
      var obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 2.2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: function () { el.textContent = obj.v.toFixed(dec); }
      });
    });

    /* parallax blobs + sections */
    gsap.utils.toArray('.hero-blob').forEach(function (b, i) {
      gsap.to(b, {
        yPercent: (i % 2 ? -18 : 22), ease: 'none',
        scrollTrigger: { trigger: b.closest('section') || b.parentElement, start: 'top top', end: 'bottom top', scrub: 1.2 }
      });
    });
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.parallax) || -12, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.4 }
      });
    });

    /* timeline items */
    gsap.utils.toArray('.tl-item').forEach(function (item) {
      gsap.fromTo(item, { x: -46, opacity: 0 }, {
        x: 0, opacity: 1, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 84%' }
      });
    });

    /* footer giant text slide */
    var giant = document.querySelector('.footer-giant');
    if (giant) {
      gsap.fromTo(giant, { yPercent: 46, opacity: 0 }, {
        yPercent: 0, opacity: 1, ease: 'power2.out', duration: 1.2,
        scrollTrigger: { trigger: giant, start: 'top 96%' }
      });
    }

    killPreloader();
  });

  /* ---------- 3D tilt on brand cards ---------- */
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    if (!matchMedia('(hover:hover)').matches) return;
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(1100px) rotateY(' + px * 7 + 'deg) rotateX(' + -py * 7 + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transition = 'transform .7s cubic-bezier(.22,1.4,.36,1)';
      card.style.transform = 'perspective(1100px) rotateY(0) rotateX(0)';
      setTimeout(function () { card.style.transition = ''; }, 700);
    });
  });

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    if (!matchMedia('(hover:hover)').matches) return;
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.28;
      var y = (e.clientY - r.top - r.height / 2) * 0.34;
      btn.style.transform = 'translate(' + x + 'px,' + (y - 3) + 'px) scale(1.03)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
  });

  /* ---------- Confetti ---------- */
  var CONF_COLORS = ['#E23B43', '#232E62', '#F2B84B', '#FF6A5B', '#ffffff'];
  window.mkConfetti = function (x, y) {
    for (var i = 0; i < 42; i++) {
      var bit = document.createElement('i');
      bit.className = 'confetti-bit';
      var c = CONF_COLORS[i % CONF_COLORS.length];
      bit.style.background = c;
      bit.style.borderRadius = i % 3 ? '2px' : '50%';
      document.body.appendChild(bit);
      var ang = Math.random() * Math.PI * 2;
      var v = 220 + Math.random() * 380;
      var dx = Math.cos(ang) * v, dy = Math.sin(ang) * v - 190;
      bit.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy + 480) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }
      ], { duration: 1200 + Math.random() * 900, easing: 'cubic-bezier(.15,.6,.4,1)' }).onfinish = function () { this.effect.target.remove(); };
    }
  };
  document.querySelectorAll('[data-confetti]').forEach(function (el) {
    el.addEventListener('click', function (e) { mkConfetti(e.clientX, e.clientY); });
  });

  /* ---------- Scroll progress bar ---------- */
  var prog = document.createElement('div');
  prog.className = 'scroll-progress';
  document.body.appendChild(prog);
  addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  }, { passive: true });

  /* ---------- Lightbox for gallery photos ---------- */
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button class="lightbox-close" aria-label="Close">✕</button><img alt="">';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img');
  function openLb(src, alt) {
    lbImg.src = src; lbImg.alt = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  document.querySelectorAll('.masonry img, .moment img, .filmstrip img').forEach(function (img) {
    img.addEventListener('click', function () { openLb(img.src, img.alt); });
  });

  /* ---------- Smooth page transitions ---------- */
  document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (/^https?:/.test(href)) return; // external
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(function () { location.href = href; }, 230);
    });
  });

  /* ---------- Founder photo fallbacks ---------- */
  document.querySelectorAll('.founder-photo img').forEach(function (img) {
    img.addEventListener('error', function () {
      var fb = document.createElement('div');
      fb.className = 'founder-fallback';
      fb.innerHTML = '<b>' + (img.dataset.initials || 'MK') + '</b>';
      img.replaceWith(fb);
    });
  });
})();
