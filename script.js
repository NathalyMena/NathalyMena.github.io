/* =========================================================
   Nathaly Mena — Portafolio UX/UI
   ========================================================= */

/* ---------- 1. CONTENIDO EDITABLE ---------- */
// Enlace a tu perfil de Behance (se aplica a todos los botones "Behance").
const BEHANCE_PROFILE = 'https://www.behance.net/';

const CATEGORIES = {
  all:      'Todos',
  ux:       'UX/UI & Producto',
  ds:       'Design Systems',
  research: 'Investigación & Servicio',
};

// Un objeto por proyecto de Behance. `id` es el número del embed.
// EDITA: title, cat, summary, tags y (opcional) cover: './assets/portada.jpg'.
const PROJECTS = [
  { id: '173104053', cat: 'ux',       title: 'Caso de estudio 01', tags: ['UX/UI', 'Producto digital'] },
  { id: '143928289', cat: 'ux',       title: 'Caso de estudio 02', tags: ['UX/UI', 'Prototipado'] },
  { id: '121317481', cat: 'ds',       title: 'Caso de estudio 03', tags: ['Design System', 'UI'] },
  { id: '127262537', cat: 'research', title: 'Caso de estudio 04', tags: ['UX Research', 'Service Design'] },
  { id: '132285327', cat: 'ux',       title: 'Caso de estudio 05', tags: ['UX/UI', 'Arquitectura de información'] },
  { id: '118103147', cat: 'ds',       title: 'Caso de estudio 06', tags: ['Sistema gráfico', 'UI'] },
  { id: '114796861', cat: 'research', title: 'Caso de estudio 07', tags: ['Investigación', 'Accesibilidad'] },
].map(p => ({
  summary: 'Presentación completa publicada en Behance: contexto, proceso, decisiones de diseño y resultado.',
  cover: '',
  ...p,
}));

const embedUrl   = id => `https://www.behance.net/embed/project/${id}?ilo0=1`;
const galleryUrl = id => `https://www.behance.net/gallery/${id}/_`;

/* ---------- 2. UTILIDADES ---------- */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

$$('[data-behance]').forEach(a => (a.href = BEHANCE_PROFILE));
$('#year').textContent = new Date().getFullYear();

/* ---------- 3. PROYECTOS: filtros + tarjetas ---------- */
const grid = $('#grid');
const filters = $('#filters');
let currentCat = 'all';
let visible = PROJECTS;

// Paletas de la portada generativa (se usa mientras no haya `cover`).
const COVERS = [
  { bg: '#0026E6', fg: '#fff',    cap: '#FFCC00', arc: '#00F5D4' },
  { bg: '#FFCC00', fg: '#0B132B', cap: '#0026E6', arc: '#00F5D4' },
  { bg: '#0B132B', fg: '#fff',    cap: '#0026E6', arc: '#FFCC00' },
  { bg: '#DFF8F4', fg: '#0B132B', cap: '#FFCC00', arc: '#0026E6' },
];

function coverMarkup(p, n) {
  if (p.cover) return `<img src="${p.cover}" alt="" loading="lazy">`;
  return `<span class="gen">
      <span class="gen__num">${String(n + 1).padStart(2, '0')}</span>
      <span class="gen__cap"></span>
      <svg viewBox="0 0 400 160" aria-hidden="true"><path d="M12 10 C 80 190, 320 190, 388 10"/></svg>
      <i class="reg reg--tr"></i><i class="reg reg--bl"></i><i class="reg reg--br"></i>
    </span>`;
}

function renderFilters() {
  filters.innerHTML = Object.entries(CATEGORIES).map(([key, label]) => {
    const count = key === 'all' ? PROJECTS.length : PROJECTS.filter(p => p.cat === key).length;
    return `<button class="filter" data-cat="${key}" aria-pressed="${key === currentCat}">${label}<small>${count}</small></button>`;
  }).join('');
}

function renderGrid() {
  visible = currentCat === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === currentCat);
  grid.dataset.count = visible.length;
  if (!visible.length) {
    grid.innerHTML = '<p class="empty">Aún no hay proyectos en esta categoría.</p>';
    return;
  }
  grid.innerHTML = visible.map((p, i) => {
    const n = PROJECTS.indexOf(p);
    const c = COVERS[n % COVERS.length];
    return `<article class="pcard" style="--i:${i};--c-bg:${c.bg};--c-fg:${c.fg};--c-cap:${c.cap};--c-arc:${c.arc}">
      <button class="pcard__cover" data-open="${i}" aria-label="Ver presentación interactiva de ${p.title}">
        ${coverMarkup(p, n)}
        <span class="pcard__play" aria-hidden="true">▶ Ver presentación</span>
      </button>
      <div class="pcard__body">
        <span class="pcard__cat">${CATEGORIES[p.cat]}</span>
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
        <ul class="tags">${p.tags.map(t => `<li>${t}</li>`).join('')}</ul>
        <div class="pcard__actions">
          <button class="btn btn--blue btn--sm" data-open="${i}">Ver presentación interactiva</button>
          <a class="link" href="${galleryUrl(p.id)}" target="_blank" rel="noopener">Ver en Behance ↗</a>
        </div>
      </div>
    </article>`;
  }).join('');
}

filters.addEventListener('click', e => {
  const btn = e.target.closest('.filter');
  if (!btn || btn.dataset.cat === currentCat) return;
  currentCat = btn.dataset.cat;
  $$('.filter', filters).forEach(b => b.setAttribute('aria-pressed', b === btn));
  renderGrid();
});

renderFilters();
renderGrid();

/* ---------- 4. MODAL con embed de Behance (carga diferida) ---------- */
const modal = $('#modal');
const stage = $('#modalStage');
const loader = $('#modalLoader');
let modalIndex = 0;
let lastFocus = null;
let slowTimer;
const loaderText = $('span', loader);

function loadProject(i) {
  modalIndex = (i + visible.length) % visible.length;
  const p = visible[modalIndex];
  $('#modalTitle').textContent = p.title;
  $('#modalCat').textContent = CATEGORIES[p.cat];
  $('#modalCount').textContent = `${modalIndex + 1} / ${visible.length}`;
  $('#modalLink').href = galleryUrl(p.id);

  // El iframe solo existe mientras el modal está abierto: nada de Behance se carga antes.
  $('iframe', stage)?.remove();
  loader.hidden = false;
  loaderText.textContent = 'Cargando presentación…';
  clearTimeout(slowTimer);
  slowTimer = setTimeout(() => { loaderText.textContent = '¿Tarda en cargar? Usa «Abrir en Behance» arriba.'; }, 7000);
  const frame = document.createElement('iframe');
  frame.title = `Presentación de ${p.title} en Behance`;
  frame.loading = 'lazy';
  frame.allowFullscreen = true;
  frame.allow = 'clipboard-write';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.addEventListener('load', () => { frame.classList.add('is-ready'); loader.hidden = true; clearTimeout(slowTimer); });
  frame.src = embedUrl(p.id);
  stage.append(frame);
}

function openModal(i) {
  lastFocus = document.activeElement;
  loadProject(i);
  modal.showModal();
  document.body.style.overflow = 'hidden';
}

grid.addEventListener('click', e => {
  const opener = e.target.closest('[data-open]');
  if (opener) openModal(+opener.dataset.open);
});
$('#modalPrev').addEventListener('click', () => loadProject(modalIndex - 1));
$('#modalNext').addEventListener('click', () => loadProject(modalIndex + 1));
$('#modalClose').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); }); // clic en el fondo
modal.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') loadProject(modalIndex - 1);
  if (e.key === 'ArrowRight') loadProject(modalIndex + 1);
});
modal.addEventListener('close', () => {
  $('iframe', stage)?.remove();
  clearTimeout(slowTimer);
  document.body.style.overflow = '';
  lastFocus?.focus();
});

/* ---------- 5. SCROLL-REVEAL ---------- */
const revealer = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    revealer.unobserve(en.target);
  });
}, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal], #grid').forEach(el => revealer.observe(el));

/* ---------- 6. COREOGRAFÍA DE SCROLL ---------- */
const hero = $('.hero');
const bar = $('#progressBar');
const regmarks = $('.regmarks');
const tape = $('#tape');
const timeline = $('#timeline');
const contactPanel = $('.contact__panel');
const navLinks = $$('.nav__links a[href^="#"]:not(.btn)');
const sections = navLinks.map(a => $(a.getAttribute('href')));
let ticking = false;
let litTimer;

function onScroll() {
  ticking = false;
  const y = scrollY;
  const vh = innerHeight;
  const max = root.scrollHeight - vh;
  const heroH = hero.offsetHeight;

  // Barra de progreso de lectura
  bar.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;

  // Hero: 0 → 1 mientras sale. Controla color de fondo, escala y radio del panel (ver CSS).
  root.style.setProperty('--hero-p', reduced ? (y > heroH * 0.5 ? 1 : 0) : clamp(y / (heroH * 0.85)).toFixed(4));
  document.body.classList.toggle('past-hero', y > heroH - 90);

  if (!reduced) {
    // Marcas de registro: rotan con el scroll y se iluminan mientras hay movimiento
    const rot = `${(y * 0.25).toFixed(1)}deg`;
    regmarks.style.setProperty('--rot', rot);
    contactPanel.style.setProperty('--rot', rot);
    regmarks.classList.add('is-lit');
    clearTimeout(litTimer);
    litTimer = setTimeout(() => regmarks.classList.remove('is-lit'), 220);

    // Cinta de disciplinas: desplazamiento horizontal ligado al scroll
    tape.style.transform = `translateX(${-(y * 0.35) % (tape.scrollWidth / 2)}px)`;
  }

  // Línea de tiempo: se llena a medida que se lee
  const r = timeline.getBoundingClientRect();
  timeline.style.setProperty('--fill', clamp((vh * 0.7 - r.top) / r.height).toFixed(4));

  // Enlace activo en la navegación
  let active = -1;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) active = i; });
  navLinks.forEach((a, i) => a.classList.toggle('is-active', i === active));
}

addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* ---------- 7. PARALLAX DE LA FOTO CON EL MOUSE ---------- */
const frame = $('#frame');
if (!reduced && matchMedia('(pointer: fine)').matches) {
  const panel = $('.hero__panel');
  panel.addEventListener('pointermove', e => {
    const r = panel.getBoundingClientRect();
    frame.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    frame.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  });
  panel.addEventListener('pointerleave', () => {
    frame.style.setProperty('--mx', 0);
    frame.style.setProperty('--my', 0);
  });
}

/* ---------- 8. MENÚ MÓVIL ---------- */
const nav = $('#nav');
const toggle = $('#navToggle');
const setMenu = open => {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
};
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
$$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
