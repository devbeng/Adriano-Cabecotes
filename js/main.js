(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ano do rodapé */
  var ano = $('#ano'); if (ano) ano.textContent = new Date().getFullYear();

  /* header: sombra ao rolar */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* menu mobile */
  var toggle = $('.menu-toggle'), nav = $('#menu');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1120) setMenu(false); });

  /* link ativo conforme a seção */
  var links = $$('.nav ul a'), map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); l.removeAttribute('aria-current'); });
          var a = map[en.target.id]; if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });

    /* animação de entrada */
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rev.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal').forEach(function (el) { rev.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* mapa incorporado do Google (carregado só quando o site está hospedado normalmente;
     em ambientes que bloqueiam mapas, o cartão acima continua funcionando como link) */
  var mw = $('#map-wrap');
  try {
    var host = location.hostname || '';
    if (mw && !/claude\.(ai|com)|claudeusercontent|anthropic/i.test(host)) {
      var f = document.createElement('iframe');
      f.title = 'Mapa com a localização da Adriano Retífica de Cabeçotes em Taubaté';
      f.src = mw.getAttribute('data-embed'); f.loading = 'lazy';
      f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade'); f.allowFullscreen = true;
      mw.appendChild(f);
    }
  } catch (e) {}

  /* galeria: carrossel com categorias */
  var track = $('#gal-track');
  if (track) {
    var tabs = $$('.gal-tab'), slides = $$('.slide', track), dots = $('#gal-dots'),
        curEl = $('#gal-cur'), totEl = $('#gal-total'), prev = $('#gal-prev'), next = $('#gal-next');
    var vis = function () { return slides.filter(function (s) { return !s.hidden; }); };
    var step = function () { var v = vis(); if (!v.length) return 0; return v[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0); };
    var index = function () { var s = step(); return s ? Math.min(vis().length - 1, Math.round(track.scrollLeft / s)) : 0; };
    var update = function () {
      var n = vis().length, i = index();
      curEl.textContent = i + 1; totEl.textContent = n;
      $$('i', dots).forEach(function (d, k) { d.classList.toggle('on', k === i); });
      prev.disabled = i <= 0; next.disabled = i >= n - 1;
    };
    var build = function () {
      dots.innerHTML = '';
      vis().forEach(function () { dots.appendChild(document.createElement('i')); });
      track.scrollLeft = 0; update();
    };
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
    }, { passive: true });
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
    var selectTab = function (t) {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      slides.forEach(function (s) { s.hidden = s.getAttribute('data-cat') !== t.getAttribute('data-cat'); });
      build();
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { selectTab(t); restart(); }); });

    /* passagem automática: 3 s por foto; ao fim de uma categoria, segue para a próxima */
    var gal = $('#gal'), playBtn = $('#gal-play'), INTERVAL = 3000;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var userPaused = reduce, hover = false, inView = false, timer = null;
    var syncBtn = function () {
      playBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      playBtn.setAttribute('aria-label', userPaused ? 'Retomar passagem automática' : 'Pausar passagem automática');
      playBtn.innerHTML = userPaused ? '&#9654;' : '&#10074;&#10074;';
    };
    var tick = function () {
      if (userPaused || hover || !inView || document.hidden || !$('#lightbox').hidden) return;
      if (index() < vis().length - 1) { track.scrollBy({ left: step(), behavior: 'smooth' }); }
      else {
        var k = tabs.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; });
        selectTab(tabs[(k + 1) % tabs.length]);
      }
    };
    var restart = function () { clearInterval(timer); timer = setInterval(tick, INTERVAL); };
    prev.addEventListener('click', restart); next.addEventListener('click', restart);
    playBtn.addEventListener('click', function () { userPaused = !userPaused; syncBtn(); restart(); });
    gal.addEventListener('mouseenter', function () { hover = true; });
    gal.addEventListener('mouseleave', function () { hover = false; restart(); });
    gal.addEventListener('focusin', function () { hover = true; });
    gal.addEventListener('focusout', function () { hover = false; restart(); });
    var tt = null;
    track.addEventListener('touchstart', function () { hover = true; clearTimeout(tt); }, { passive: true });
    track.addEventListener('touchend', function () { clearTimeout(tt); tt = setTimeout(function () { hover = false; restart(); }, 4000); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) restart(); }, { threshold: .35 }).observe(gal);
    } else { inView = true; }
    syncBtn(); restart();
    window.addEventListener('resize', update);
    build();
  }

  /* lightbox */
  var lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  var items = [], cur = 0, lastFocus = null, startX = null;
  function visibleItems() { return $$('.g-item').filter(function (b) { return !b.closest('[hidden]'); }); }
  function show(i) {
    cur = (i + items.length) % items.length;
    var it = items[cur];
    lbImg.src = it.getAttribute('data-full');
    lbImg.alt = it.getAttribute('data-alt') || '';
    lbCap.textContent = it.getAttribute('data-cap') + '  ·  ' + (cur + 1) + ' / ' + items.length;
  }
  function open(i) {
    lastFocus = document.activeElement;
    items = visibleItems();
    lb.hidden = false; document.body.classList.add('lb-open'); show(i);
    $('.lb-close', lb).focus();
  }
  function close() {
    lb.hidden = true; document.body.classList.remove('lb-open'); lbImg.src = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('.g-item').forEach(function (it) { it.addEventListener('click', function () { open(visibleItems().indexOf(it)); }); });
  $('.lb-close', lb).addEventListener('click', close);
  $('.lb-prev', lb).addEventListener('click', function () { show(cur - 1); });
  $('.lb-next', lb).addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'Tab') { /* prende o foco dentro do diálogo */
      var f = $$('button', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  lb.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX; startX = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
