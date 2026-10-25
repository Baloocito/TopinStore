(() => {
  // Origen de la visita: ?src=qr | ig | yt ... o, si no viene, se deduce del referrer.
  const params = new URLSearchParams(location.search);
  let src = params.get('src');
  try {
    if (!src) src = sessionStorage.getItem('src');
    if (src) sessionStorage.setItem('src', src);
  } catch (_) {}
  if (!src) {
    const ref = document.referrer;
    const ua = navigator.userAgent;
    if (/instagram/i.test(ref) || /Instagram/.test(ua)) src = 'ig';
    else if (/tiktok/i.test(ref) || /TikTok/.test(ua)) src = 'tiktok';
    else if (/youtube|youtu\.be/i.test(ref)) src = 'yt';
    else if (/t\.me|telegram/i.test(ref)) src = 'tg';
    else src = ref ? 'web' : 'direct';
  }
  src = String(src).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'direct';

  const PREVIEW = window.HUB_DATA ? new Map() : null;
  const go = (id) => (PREVIEW && PREVIEW.get(id)) || `/go/${encodeURIComponent(id)}?src=${encodeURIComponent(src)}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONS = {
    bag: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
    handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-2 1-2-1-4 4"/><path d="M3 7l4-2 4 2 4-2 3 1 3 5-3 3"/><path d="M3 7v6l3 3"/>',
    ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 3 2.5 5 5.5 5"/>',
    tg: '<path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 8-6"/>',
    pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    android: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
    yt: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const $ = (sel) => document.querySelector(sel);

  function render(data) {
    const p = data.profile;
    const bio = $('[data-bind="bio"]');
    bio.textContent = p.bio || '';
    bio.hidden = !p.bio;
    $('[data-bind="chips"]').innerHTML = p.chips.map((c) => `<li>${esc(c)}</li>`).join('');

    const f = data.featured;
    const fc = $('[data-slot="featured"]');
    fc.href = go(f.id);
    for (const k of ['kicker', 'title', 'text', 'cta']) fc.querySelector(`[data-f="${k}"]`).textContent = f[k];

    const card = (x) => `
      <a class="card path ${esc(x.color)} reveal" href="${go(x.id)}">
        <div class="row">
          <span class="icon">${icon(x.icon)}</span>
          <div>
            <div class="card-head"><span class="kicker">${esc(x.kicker)}</span><span class="arrow" aria-hidden="true">↗</span></div>
            <h3>${esc(x.title)}</h3>
            <p>${esc(x.text)}</p>
          </div>
        </div>
        ${x.progress ? `
          <div class="progress" aria-label="${esc(x.progress.label)}: ${x.progress.value}%">
            <div class="bar"><div class="fill" data-to="${Number(x.progress.value) || 0}"></div></div>
            <div class="meta pixel"><span>${esc(x.progress.label.toUpperCase())}</span><span>${Number(x.progress.value) || 0}%</span></div>
          </div>` : ''}
        <span class="btn">${esc(x.cta)}</span>
      </a>`;
    const bySlot = (slot) => data.paths.filter((x) => (x.slot || 'main') === slot).map(card).join('');
    $('[data-bind="paths-top"]').innerHTML = bySlot('top');
    $('[data-bind="paths"]').innerHTML = bySlot('main');
    $('[data-bind="paths-end"]').innerHTML = bySlot('end');

    $('[data-bind="socials"]').innerHTML = data.socials.map((s) => `
      <a class="social" href="${go(s.id)}">
        ${icon(s.id)}<b>${esc(s.label)}</b><small>${esc(s.handle)}</small>
      </a>`).join('');

    renderSupport(data.support);
    reveal();
  }

  const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');

  function renderSupport(s) {
    const box = $('[data-bind="support"]');
    if (!s) return;
    const tiers = (s.tiers || []).filter((t) => t.url);
    const g = s.goal;
    const pct = g && g.target > 0 ? Math.min(100, Math.round((g.raised / g.target) * 100)) : null;
    box.innerHTML = `
      <div class="sup-head">
        <span class="flame" aria-hidden="true"><i></i><i></i><i></i></span>
        <div>
          <span class="kicker">${esc(s.kicker)}</span>
          <h3 id="support-title">${esc(s.title)}</h3>
        </div>
      </div>
      <p>${esc(s.text)}</p>
      ${s.demo ? `
        <div class="demo">
          <span class="demo-badge pixel">${esc(s.demo.badge)}</span>
          <div class="demo-txt"><b>${esc(s.demo.title)}</b><small>${esc(s.demo.platforms)}</small></div>
          <span class="demo-plat" aria-hidden="true">${icon('pc')}${icon('android')}</span>
        </div>` : ''}
      ${pct !== null ? `
        <div class="goal" aria-label="${esc(g.label)}: ${pct}%">
          <div class="goal-top"><span>${esc(g.label)}</span><b>${pct}%</b></div>
          <div class="bar"><div class="fill" data-to="${pct}"></div></div>
          <div class="goal-meta pixel"><span>${clp(g.raised)}</span><span>META ${clp(g.target)}</span></div>
        </div>` : ''}
      ${tiers.length ? `
        <div class="pay-head"><span class="pay-name mp">${esc((s.local && s.local.name) || 'Mercado Pago')}</span><small>${esc((s.local && s.local.note) || '')}</small></div>
        <div class="tiers">${tiers.map((t) => `
          <a class="tier" href="${go(t.id)}"><b>${esc(t.amount)}</b><small>${esc(t.name)}</small></a>`).join('')}
        </div>
        ${s.demo && s.proof ? `
          <div class="proof">
            <p>${esc(s.demo.mpNote)}</p>
            <a class="btn proof-btn" href="${go(s.proof.id)}">${icon('wa')}<span>${esc(s.proof.label)}</span></a>
          </div>` : ''}` : ''}
      ${s.intl ? `
        <div class="pay-head"><span class="pay-name kofi">${esc(s.intl.name || 'Ko-fi')}</span><small>Para quienes están fuera de Chile</small></div>
        ${s.demo ? `<p class="kofi-note">${esc(s.demo.kofiNote)}</p>` : ''}
        <a class="btn sup-intl" href="${go(s.intl.id)}">
          <span>${esc(s.intl.label)}</span><small>${esc(s.intl.sub)}</small>
        </a>` : ''}`;
    box.hidden = false;
  }

  function reveal() {
    document.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', i));
    requestAnimationFrame(() => setTimeout(() => {
      document.querySelectorAll('.fill').forEach((b) => { b.style.width = b.dataset.to + '%'; });
    }, 400));
  }

  function ago(iso) {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return `hace ${d} día${d > 1 ? 's' : ''}`;
  }

  async function loadDeal() {
    try {
      const r = await fetch('/api/deal');
      const d = r.ok ? await r.json() : null;
      if (!d || !d.title) return;
      const box = $('[data-deal]');
      $('[data-deal-title]').textContent = d.title;
      $('[data-deal-detail]').textContent = d.detail || '';
      $('[data-deal-time]').textContent = d.at ? ago(d.at) : '';
      box.hidden = false;
    } catch (_) {}
  }

  // Feedback táctil inmediato en móviles.
  document.addEventListener('touchstart', (e) => {
    const c = e.target.closest('.card'); if (c) c.classList.add('pressed');
  }, { passive: true });
  ['touchend', 'touchcancel'].forEach((t) => document.addEventListener(t, () => {
    document.querySelectorAll('.card.pressed').forEach((c) => c.classList.remove('pressed'));
  }, { passive: true }));

  if (window.HUB_DATA) {
    const d = window.HUB_DATA;
    [d.featured, ...d.paths, ...d.socials, ...((d.support && d.support.tiers) || []), ...(d.support && d.support.intl ? [d.support.intl] : []), ...(d.support && d.support.proof ? [d.support.proof] : [])].forEach((x) => PREVIEW.set(x.id, x.url));
    render(d);
    return;
  }
  fetch('/data/links.json')
    .then((r) => r.json())
    .then(render)
    .catch(() => reveal());
  loadDeal();

  // Visita registrada sin bloquear la carga.
  const hit = `/api/hit?src=${encodeURIComponent(src)}`;
  if (navigator.sendBeacon) navigator.sendBeacon(hit); else fetch(hit, { keepalive: true });
})();
