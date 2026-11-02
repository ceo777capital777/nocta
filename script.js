/* NOCTA — interactions */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  const onReveal = (el) => {
    el.classList.add('is-in');
    el.querySelectorAll('.count').forEach(runCounter);
    if (el.classList.contains('counter')) el.querySelectorAll('.count').forEach(runCounter);
  };
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { onReveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach(onReveal);
  }

  /* ---------- Counters ---------- */
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const fmt = (v) => v.toFixed(dec).replace('.', ',');
    if (reduced) { el.textContent = fmt(to); return; }
    const dur = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Navbar state & active link ---------- */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  let lastY = 0;

  /* ---------- Timeline progress ---------- */
  const timeline = $('.timeline');
  const steps = $$('.step');

  /* ---------- Parallax blobs ---------- */
  const blobs = $$('[data-parallax]');

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    lastY = y;

    // active link
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s; });
    links.forEach((a) => a.classList.toggle('is-active', current && a.getAttribute('href') === '#' + current.id));

    // timeline
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.6 - r.top) / r.height, 0), 1);
      timeline.style.setProperty('--progress', p.toFixed(3));
      steps.forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle('is-active', sr.top < vh * 0.6);
      });
    }

    // parallax
    if (!reduced) blobs.forEach((b) => { b.style.transform = `translate3d(0, ${y * parseFloat(b.dataset.parallax)}px, 0)`; });
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 400); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });

  /* ---------- Desktop-only effects ---------- */
  if (finePointer && !reduced) {
    // cursor glow
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; root.classList.add('has-cursor'); }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('has-cursor'));
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    // magnetic buttons
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1), box-shadow .4s, background .3s';
        btn.style.transform = '';
        setTimeout(() => { btn.style.transition = ''; }, 600);
      });
    });

    // tilt + spotlight
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-4px)`;
      });
      const T = 'opacity 1s, filter 1s, border-color .4s, box-shadow .5s, ';
      card.addEventListener('pointerenter', () => { card.style.transition = T + 'transform .2s ease-out'; });
      card.addEventListener('pointerleave', () => { card.style.transition = T + 'transform .7s cubic-bezier(.2,.8,.2,1)'; card.style.transform = ''; });
    });
  }

  /* ---------- FAQ: one open at a time ---------- */
  const faqs = $$('.faq__item');
  faqs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- Form (front-end only) ---------- */
  const form = $('.form');
  if (form) {
    const err = $('.form__error', form);
    const ok = $('.form__success', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      $$('.field', form).forEach((f) => {
        const input = f.querySelector('input, textarea');
        const bad = !input.value.trim();
        f.classList.toggle('is-invalid', bad);
        input.setAttribute('aria-invalid', String(bad));
        if (bad) valid = false;
      });
      err.hidden = valid;
      if (!valid) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      const btn = form.querySelector('button[type="submit"] span');
      btn.textContent = 'Отправляем…';
      setTimeout(() => {
        ok.hidden = false;
        form.reset();
        btn.textContent = 'Отправить заявку';
      }, 900);
    });
    $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => i.closest('.field')?.classList.remove('is-invalid')));
  }
})();
