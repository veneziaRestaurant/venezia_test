/**
 * Kleines, abhängigkeitsfreies Skript für alle interaktiven Teile der Seite.
 * (Bewusst ohne React/Framer Motion: hält die Seite auf dem Handy schnell.)
 */

type Slot = { day: string; open: string; close: string };
interface SiteConfig {
  whatsapp: string;
  restaurant: string;
  template: string;
  locale: string;
  timezone: string;
  hours: Slot[];
  noteLabel: string;
  closedText: string;
  openText: string;
  untilText: string;
  closures?: { from: string; to: string; reason: string }[];
  closedTodayText: string;
  closedBannerText: string;
  closedDayText: string;
  closedSpecialText: string;
  tooLateText: string;
}

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
const cfg: SiteConfig = JSON.parse($('#site-config')?.textContent || '{}');
const DAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------ Hell/Dunkel */
function syncThemeIcons() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $$('.theme-icon-dark').forEach((el) => el.classList.toggle('hidden', dark));
  $$('.theme-icon-light').forEach((el) => el.classList.toggle('hidden', !dark));
}
syncThemeIcons();
$$('[data-theme-toggle]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    syncThemeIcons();
  })
);

/* ------------------------------------------------- Zeit in Restaurant-Zeitzone */
function nowInRestaurant() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: cfg.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return {
    day: DAYS[wd],
    minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
    iso: `${get('year')}-${get('month')}-${get('day')}`,
  };
}
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const fmt = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/** Schließzeit nach Mitternacht (z. B. 01:00) korrekt behandeln */
const slotRange = (s: Slot) => {
  const o = toMin(s.open);
  let c = toMin(s.close);
  if (c <= o) c += 24 * 60;
  return [o, c] as const;
};

/* ----------------------------------------- Ausnahmsweise geschlossene Tage */
/** Liefert die Schließung, die das Datum (YYYY-MM-DD) betrifft – oder undefined */
const closureOn = (iso: string) => (cfg.closures ?? []).find((c) => iso >= c.from && iso <= c.to);
/** Datum ± Tage, rein auf Kalenderbasis (keine Zeitzonen-Probleme) */
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(cfg.locale, { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

(function closures() {
  const today = nowInRestaurant().iso;
  // Vergangene Einträge in der Öffnungszeiten-Liste ausblenden
  const list = $('[data-closures]');
  if (list) {
    $$<HTMLElement>('li[data-to]', list).forEach((li) => { if (li.dataset.to! < today) li.remove(); });
    if (!$('li', list)) list.remove();
  }
  // Heutige Zeile in der Öffnungszeiten-Tabelle als geschlossen anzeigen
  if (closureOn(today)) {
    $$(`tr[data-day="${nowInRestaurant().day}"] td`).forEach((td) => {
      td.innerHTML = '';
      const span = document.createElement('span');
      span.className = 'closed';
      span.textContent = cfg.closedTodayText;
      td.append(span);
    });
  }
  // Hinweisbalken: heute geschlossen oder Schließung in den nächsten 7 Tagen
  const banner = $('[data-closure-banner]');
  const next = (cfg.closures ?? []).find((c) => c.to >= today && c.from <= addDays(today, 7));
  if (!banner || !next) return;
  const range = next.from === next.to ? fmtDate(next.from) : `${fmtDate(next.from)} – ${fmtDate(next.to)}`;
  $('[data-closure-text]', banner)!.textContent = `${cfg.closedBannerText}: ${range}${next.reason ? ` · ${next.reason}` : ''}`;
  banner.hidden = false;
})();

/* --------------------------------------------------------- Geöffnet-Status */
(function openStatus() {
  const pill = $('[data-open-status]');
  const now = nowInRestaurant();
  $$(`tr[data-day="${now.day}"]`).forEach((tr) => tr.classList.add('is-today'));
  if (!pill || !cfg.hours) return;
  const prevDay = DAYS[(DAYS.indexOf(now.day) + 6) % 7];
  let openUntil: string | null = null;
  const closedToday = closureOn(now.iso);
  const closedYesterday = closureOn(addDays(now.iso, -1));
  for (const s of cfg.hours) {
    const [o, c] = slotRange(s);
    if (!closedToday && s.day === now.day && now.minutes >= o && now.minutes < c) openUntil = s.close;
    if (!closedYesterday && s.day === prevDay && c > 1440 && now.minutes < c - 1440) openUntil = s.close;
  }
  pill.dataset.open = String(!!openUntil);
  $('[data-open-text]', pill)!.textContent = openUntil
    ? `${cfg.openText} · ${cfg.untilText} ${openUntil}`
    : closedToday ? cfg.closedTodayText : cfg.closedText;
  pill.style.visibility = 'visible';
})();

/* ------------------------------------- Mögliche Uhrzeiten für ein Datum */
/**
 * Liefert die wählbaren Uhrzeiten eines Tages – berücksichtigt Öffnungszeiten,
 * Ruhetage und ausnahmsweise geschlossene Tage.
 * step = Takt in Minuten, startGap/endGap = Abstand zu Öffnung/Schließung, lead = Vorlauf ab jetzt
 */
function timeSlots(dateIso: string, step: number, startGap: number, endGap: number, lead = 30) {
  const now = nowInRestaurant();
  const day = DAYS[new Date(`${dateIso}T12:00:00`).getDay()];
  const special = closureOn(dateIso);
  const slots = special ? [] : cfg.hours.filter((s) => s.day === day);
  const options: string[] = [];
  let past = 0; // Uhrzeiten, die heute schon vorbei sind
  for (const s of slots) {
    const [o, c] = slotRange(s);
    for (let m = Math.ceil((o + startGap) / step) * step; m <= c - endGap; m += step) {
      if (dateIso === now.iso && m < now.minutes + lead) { past++; continue; }
      options.push(fmt(m));
    }
  }
  return { options, special, tooLate: !options.length && past > 0 };
}
/** Hinweistext, wenn an einem Tag keine Uhrzeit möglich ist */
const closedMessage = (special?: { reason: string }, tooLate = false) =>
  special ? `${cfg.closedSpecialText}${special.reason ? ` (${special.reason})` : ''}` : tooLate ? cfg.tooLateText : cfg.closedDayText;

/* ------------------------------------------------- Reservierung per WhatsApp */
(function reservation() {
  const dialog = $<HTMLDialogElement>('#reserve-dialog');
  const form = $<HTMLFormElement>('[data-res-form]');
  if (!dialog || !form || typeof dialog.showModal !== 'function') return; // Fallback: Links öffnen WhatsApp direkt
  const date = form.elements.namedItem('date') as HTMLInputElement;
  const time = form.elements.namedItem('time') as HTMLSelectElement;
  const warn = $('[data-closed-warn]', form)!;
  const submit = $<HTMLButtonElement>('button[type="submit"]', form)!;
  const today = nowInRestaurant();
  date.min = today.iso;
  date.value = today.iso;

  function fillTimes() {
    const prev = time.value;
    time.innerHTML = '';
    // Reservierungen im 30-Minuten-Takt bis 1 Stunde vor Schließung
    const { options, special, tooLate } = date.value ? timeSlots(date.value, 30, 0, 60) : { options: [] as string[], special: undefined, tooLate: false };
    for (const v of options) time.add(new Option(v, v, false, v === prev));
    if (!time.value && options.length) time.value = options.find((v) => v >= '18:30') ?? options[0];
    const closed = !date.value || options.length === 0;
    warn.textContent = closedMessage(special, tooLate);
    warn.hidden = !closed;
    time.disabled = closed;
    submit.disabled = closed;
  }
  date.addEventListener('change', fillTimes);

  $$('[data-reserve]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      fillTimes();
      dialog.showModal();
      setTimeout(() => (form.elements.namedItem('name') as HTMLInputElement).focus(), 50);
    })
  );
  // Klick auf den abgedunkelten Hintergrund schließt den Dialog
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    if (!name) {
      (form.elements.namedItem('name') as HTMLInputElement).focus();
      (form.elements.namedItem('name') as HTMLInputElement).reportValidity();
      return;
    }
    const dateText = new Intl.DateTimeFormat(cfg.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(`${data.get('date')}T12:00:00`));
    const note = String(data.get('note') || '').trim();
    const text = cfg.template
      .replaceAll('{restaurant}', cfg.restaurant)
      .replaceAll('{name}', name)
      .replaceAll('{persons}', String(data.get('persons')))
      .replaceAll('{date}', dateText)
      .replaceAll('{time}', String(data.get('time')))
      .replaceAll('{note}', note ? `📝 ${cfg.noteLabel}: ${note}\n` : '');
    const url = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) location.href = url;
    dialog.close();
  });
})();

/* ------------------------------------------- Warenkorb & Bestellung (WhatsApp) */
(function cart() {
  const dlg = $<HTMLDialogElement>('#order-dialog');
  const fab = $<HTMLButtonElement>('[data-cart-open]');
  const cfgEl = $('#order-config');
  if (!dlg || !fab || !cfgEl || typeof dlg.showModal !== 'function') return;
  const ocfg: Record<string, string> = JSON.parse(cfgEl.textContent || '{}');

  type Item = { key: string; name: string; nameDe: string; size: string; price: number };
  type Line = Item & { qty: number };
  const STORE = 'venezia-cart-v1';

  // Alle bestellbaren Artikel der Seite (ausverkaufte haben keinen „+“-Button)
  const addBtns = $$<HTMLButtonElement>('[data-add]');
  const catalog = new Map<string, Item>();
  for (const b of addBtns) {
    catalog.set(b.dataset.key!, {
      key: b.dataset.key!,
      name: b.dataset.name || '',
      nameDe: b.dataset.nameDe || b.dataset.name || '',
      size: b.dataset.size || '',
      price: Number(b.dataset.price) || 0,
    });
  }

  // Warenkorb aus dem Browser laden – Preise immer frisch von der Seite, entfernte Artikel fallen raus
  let lines: Line[] = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '[]');
    if (Array.isArray(saved))
      lines = saved
        .filter((l) => l && catalog.has(l.key) && Number(l.qty) > 0)
        .map((l) => ({ ...catalog.get(l.key)!, qty: Math.min(99, Math.floor(Number(l.qty))) }));
  } catch {}
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(lines.map(({ key, qty }) => ({ key, qty })))); } catch {}
  };

  const money = new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: 'EUR' });
  const count = () => lines.reduce((n, l) => n + l.qty, 0);
  const total = () => lines.reduce((n, l) => n + l.qty * l.price, 0);

  const list = $('[data-cart-list]', dlg)!;
  const empty = $('[data-cart-empty]', dlg)!;
  const sum = $('[data-cart-sum]', dlg)!;
  const sumValue = $('[data-cart-sum-value]', dlg)!;
  const form = $<HTMLFormElement>('[data-order-form]', dlg)!;
  const main = $('[data-order-main]', dlg)!;
  const done = $('[data-order-done]', dlg)!;
  const live = $('[data-cart-live]');
  const countEl = $('[data-cart-count]', fab)!;
  const totalEl = $('[data-cart-total]', fab)!;

  function render() {
    const n = count();
    fab.hidden = n === 0;
    countEl.textContent = String(n);
    totalEl.textContent = money.format(total());
    sumValue.textContent = money.format(total());
    empty.hidden = n > 0;
    sum.hidden = form.hidden = n === 0;
    list.replaceChildren(
      ...lines.map((l) => {
        const li = document.createElement('li');
        li.dataset.key = l.key;
        const label = document.createElement('span');
        label.className = 'cl-name';
        label.textContent = l.name;
        if (l.size) {
          const small = document.createElement('small');
          small.textContent = l.size;
          label.append(small);
        }
        const qty = document.createElement('span');
        qty.className = 'cl-qty';
        const dec = document.createElement('button');
        dec.type = 'button'; dec.dataset.dec = ''; dec.textContent = '−';
        dec.setAttribute('aria-label', `${l.name}: ${ocfg.less}`);
        const out = document.createElement('output');
        out.textContent = String(l.qty);
        const inc = document.createElement('button');
        inc.type = 'button'; inc.dataset.inc = ''; inc.textContent = '+';
        inc.setAttribute('aria-label', `${l.name}: ${ocfg.more}`);
        qty.append(dec, out, inc);
        const price = document.createElement('span');
        price.className = 'cl-sum';
        price.textContent = money.format(l.qty * l.price);
        li.append(label, qty, price);
        return li;
      })
    );
    // Menge direkt am „+“-Button der Karte anzeigen
    for (const b of addBtns) {
      const l = lines.find((x) => x.key === b.dataset.key);
      b.classList.toggle('in-cart', !!l);
      if (l) b.dataset.qty = String(l.qty); else delete b.dataset.qty;
    }
  }

  function change(key: string, delta: number) {
    const item = catalog.get(key);
    if (!item) return;
    const line = lines.find((l) => l.key === key);
    if (line) line.qty = Math.max(0, Math.min(99, line.qty + delta));
    else if (delta > 0) lines.push({ ...item, qty: delta });
    lines = lines.filter((l) => l.qty > 0);
    save();
    render();
  }

  for (const b of addBtns) {
    b.addEventListener('click', (e) => {
      e.stopPropagation(); // Karte nicht auf-/zuklappen, kein Foto-Zoom
      change(b.dataset.key!, 1);
      fab.classList.remove('bump');
      void fab.offsetWidth; // Animation neu starten
      fab.classList.add('bump');
      b.classList.add('just-added');
      setTimeout(() => b.classList.remove('just-added'), 600);
      if (live) live.textContent = `${b.dataset.name}${b.dataset.size ? ` (${b.dataset.size})` : ''}: ${ocfg.added}`;
    });
  }
  list.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('button');
    const key = btn?.closest('li')?.dataset.key;
    if (!btn || !key) return;
    change(key, btn.hasAttribute('data-inc') ? 1 : -1);
  });

  /* ---- Formular: Abholen / Vor Ort, Datum, Uhrzeit */
  const date = form.elements.namedItem('date') as HTMLInputElement;
  const time = form.elements.namedItem('time') as HTMLSelectElement;
  const timeLabel = $('[data-time-label]', form)!;
  const personsField = $('[data-persons-field]', form)!;
  const warn = $('[data-order-warn]', form)!;
  const submit = $<HTMLButtonElement>('button[type="submit"]', form)!;
  const mode = () => (form.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value === 'dinein' ? 'dinein' : 'pickup');

  function fillTimes() {
    const prev = time.value;
    time.innerHTML = '';
    const pickup = mode() === 'pickup';
    // Abholen: 15-Minuten-Takt, frühestens 15 Min. nach Öffnung, bis 15 Min. vor Schließung
    // Vor Ort: wie Reservierung (30-Minuten-Takt, bis 1 Stunde vor Schließung)
    const { options, special, tooLate } = date.value
      ? pickup ? timeSlots(date.value, 15, 15, 15) : timeSlots(date.value, 30, 0, 60)
      : { options: [] as string[], special: undefined, tooLate: false };
    for (const v of options) time.add(new Option(v, v, false, v === prev));
    if (!time.value && options.length) time.value = options[0];
    const closed = options.length === 0;
    warn.textContent = closedMessage(special, tooLate);
    warn.hidden = !closed;
    time.disabled = closed;
    submit.disabled = closed || lines.length === 0;
    timeLabel.textContent = pickup ? ocfg.pickupTime : ocfg.arrivalTime;
    personsField.hidden = pickup;
  }
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'mode' || t.name === 'date') fillTimes();
  });

  function showForm() {
    done.hidden = true;
    main.hidden = false;
  }
  fab.addEventListener('click', () => {
    const today = nowInRestaurant().iso;
    date.min = today;
    if (!date.value || date.value < today) date.value = today;
    showForm();
    render();
    fillTimes();
    dlg.showModal();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.namedItem('name') as HTMLInputElement;
    if (!name.value.trim()) { name.focus(); name.reportValidity(); return; }
    if (!lines.length || !time.value) return;
    const data = new FormData(form);
    const items = lines
      .map((l) => `• ${l.qty}× ${l.nameDe}${l.size ? ` (${l.size})` : ''} – ${money.format(l.qty * l.price)}`)
      .join('\n');
    const modeText = mode() === 'pickup' ? ocfg.pickupLine : ocfg.dineInLine.replace('{persons}', String(data.get('persons')));
    const dateText = new Intl.DateTimeFormat(cfg.locale, { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(`${date.value}T12:00:00`));
    const note = String(data.get('note') || '').trim();
    const text = ocfg.template
      .replaceAll('{restaurant}', cfg.restaurant)
      .replaceAll('{items}', items)
      .replaceAll('{total}', money.format(total()))
      .replaceAll('{mode}', modeText)
      .replaceAll('{name}', name.value.trim())
      .replaceAll('{date}', dateText)
      .replaceAll('{time}', time.value)
      .replaceAll('{note}', note ? `📝 ${cfg.noteLabel}: ${note}\n` : '');
    const url = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) location.href = url;
    // Warenkorb erst leeren, wenn der Gast es bestätigt (falls WhatsApp nicht gesendet wurde)
    main.hidden = true;
    done.hidden = false;
  });
  $('[data-order-clear]', dlg)!.addEventListener('click', () => {
    lines = [];
    save();
    render();
    form.reset();
    dlg.close();
  });
  $('[data-order-back]', dlg)!.addEventListener('click', showForm);

  render();
})();

/* ------------------------------------------------------- Suche & Filter */
(function menuFilter() {
  const input = $<HTMLInputElement>('#menu-search');
  if (!input) return;
  const dishes = $$('[data-dish]');
  const cats = $$('[data-cat]');
  const chips = $$<HTMLButtonElement>('[data-filter]');
  const excludes = $$<HTMLInputElement>('[data-allergen-exclude]');
  const reset = $<HTMLButtonElement>('[data-filter-reset]')!;
  const info = $('[data-results]')!;
  const noResults = $('[data-no-results]')!;
  const alCount = $('[data-allergen-count]')!;
  const alSummary = $('[data-allergen-summary]')!;
  const norm = (s: string) =>
    s.toLowerCase().replace(/ß/g, 'ss').normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const index = dishes.map((el) => ({
    el,
    text: norm(el.dataset.search || ''),
    allergens: (el.dataset.allergens || '').split(' ').filter(Boolean),
    tags: (el.dataset.tags || '').split(' ').filter(Boolean),
    rec: el.dataset.rec === '1',
  }));

  function apply() {
    const terms = norm(input!.value).split(/\s+/).filter(Boolean);
    const active = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.filter!);
    const ex = excludes.filter((c) => c.checked).map((c) => c.value);
    const filtering = terms.length > 0 || active.length > 0 || ex.length > 0;
    let total = 0;

    for (const d of index) {
      const ok =
        terms.every((t) => d.text.includes(t)) &&
        active.every((f) =>
          f === 'recommended' ? d.rec : f === 'vegetarian' ? d.tags.includes('vegetarian') || d.tags.includes('vegan') : d.tags.includes(f)
        ) &&
        !d.allergens.some((a) => ex.includes(a));
      d.el.hidden = !ok;
      if (ok) total++;
    }
    for (const cat of cats) {
      const visible = $$('[data-dish]', cat).filter((d) => !d.hidden).length;
      cat.hidden = visible === 0;
      // Zwischenüberschriften ohne sichtbare Einträge ausblenden
      $$('[data-group-title]', cat).forEach((h) => {
        const list = h.nextElementSibling as HTMLElement | null;
        h.hidden = !!list && !$$('[data-dish]', list).some((d) => !d.hidden);
      });
      const link = $(`[data-cat-link="${cat.dataset.cat}"]`);
      if (link) {
        link.classList.toggle('is-empty', visible === 0);
        $('[data-cat-count]', link)!.textContent = String(visible);
      }
    }
    noResults.hidden = total > 0;
    info.textContent = filtering ? info.dataset.template!.replace('{n}', String(total)) : '';
    reset.hidden = !filtering;
    alCount.textContent = ex.length ? `(${ex.length})` : '';
    alSummary.setAttribute('aria-pressed', String(ex.length > 0));
    requestAnimationFrame(() => updateSpy());
  }

  let timer: number | undefined;
  input.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(apply, 120); });
  chips.forEach((c) =>
    c.addEventListener('click', () => {
      c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
      apply();
    })
  );
  excludes.forEach((c) => c.addEventListener('change', apply));
  reset.addEventListener('click', () => {
    input.value = '';
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    excludes.forEach((c) => (c.checked = false));
    apply();
  });
})();

/* --------------------------- Aktive Kategorie in der Navigation hervorheben */
const nav = $('[data-cat-nav]');
const links = $$<HTMLAnchorElement>('[data-cat-link]');
let currentCat = '';
function updateSpy(initial = false) {
  if (!nav) return;
  const navBottom = (nav.closest('.cat-nav') as HTMLElement).getBoundingClientRect().bottom + 24;
  let active = '';
  for (const cat of $$('[data-cat]')) {
    if (cat.hidden) continue;
    if (cat.getBoundingClientRect().top <= navBottom) active = cat.dataset.cat!;
    else break;
  }
  if (!active) active = $$('[data-cat]').find((c) => !c.hidden)?.dataset.cat ?? '';
  if (active === currentCat) return;
  currentCat = active;
  links.forEach((l) => l.setAttribute('aria-current', String(l.dataset.catLink === active)));
  const link = links.find((l) => l.dataset.catLink === active);
  // Beim Laden nicht horizontal scrollen (stört u. a. die LCP-Messung auf RTL-Seiten)
  if (link && !initial) {
    // Über Bildschirm-Koordinaten zentrieren – funktioniert für LTR und RTL gleichermaßen
    const l = link.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    const delta = l.left + l.width / 2 - (n.left + n.width / 2);
    nav.scrollBy({ left: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateSpy(); ticking = false; });
}, { passive: true });
updateSpy(true);

/* ---------------------------------------------------- Allergene aufklappen */
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('.al-btn');
  if (!btn) return;
  const panel = document.getElementById(btn.getAttribute('aria-controls')!);
  const open = btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', String(open));
  if (panel) panel.hidden = !open;
});

/* ------------------- Handy/Tablet: Karte antippen = groß, nochmal = klein */
const mqSmall = window.matchMedia('(max-width: 899px)');
// Nach dem Öffnen: sobald der Gast weiterscrollt, wird die Karte wieder klein
let openScrollY: number | null = null;
function closeDishes(except?: HTMLElement) {
  $$('[data-dish].is-open').forEach((d) => {
    if (d === except) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-expanded', 'false');
    d.querySelectorAll('source, img').forEach((el) => el.setAttribute('sizes', DISH_SIZES));
  });
}
window.addEventListener('scroll', () => {
  if (openScrollY !== null && Math.abs(window.scrollY - openScrollY) > 60) { openScrollY = null; closeDishes(); }
}, { passive: true });
function toggleDish(dish: HTMLElement) {
  if (!mqSmall.matches) return;
  const open = !dish.classList.contains('is-open');
  closeDishes(dish);
  openScrollY = null;
  if (open) setTimeout(() => { if (dish.classList.contains('is-open')) openScrollY = window.scrollY; }, 700);
  dish.classList.toggle('is-open', open);
  dish.setAttribute('aria-expanded', String(open));
  // größeres Bild laden, solange die Karte groß ist
  dish.querySelectorAll('source, img').forEach((el) => el.setAttribute('sizes', open ? '50vw' : DISH_SIZES));
  if (open) requestAnimationFrame(() => {
    const r = dish.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight) dish.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
const DISH_SIZES = '(min-width: 1180px) 280px, (min-width: 900px) 24vw, 46vw';
$$('[data-dish]').forEach((d) => { d.tabIndex = 0; d.setAttribute('aria-expanded', 'false'); });
/* --------------- Desktop: Klick auf ein Gericht zeigt das Foto groß in der Mitte */
let lightbox: HTMLElement | null = null;
function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  lightbox.querySelector('figure')!.innerHTML = '';
}
function openLightbox(dish: HTMLElement) {
  const pic = dish.querySelector('.dish-img:not(.is-fallback) picture');
  if (!pic) return;
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'dish-zoom';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = '<figure></figure>';
    lightbox.addEventListener('click', closeLightbox);
    document.body.append(lightbox);
  }
  const clone = pic.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('source, img').forEach((el) => {
    el.setAttribute('sizes', '90vw');
    el.removeAttribute('loading');
  });
  const name = dish.querySelector('.dish-name')?.textContent?.trim() ?? '';
  const price = dish.querySelector('.dish-price')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const cap = document.createElement('figcaption');
  cap.textContent = price ? `${name} · ${price}` : name;
  const fig = lightbox.querySelector('figure')!;
  fig.replaceChildren(clone, cap);
  lightbox.setAttribute('aria-label', name);
  lightbox.hidden = false;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
window.addEventListener('wheel', closeLightbox, { passive: true });
window.addEventListener('scroll', closeLightbox, { passive: true });

document.addEventListener('click', (e) => {
  const t = e.target as Element;
  const dish = t.closest<HTMLElement>('[data-dish]');
  if (dish && !mqSmall.matches) {
    if (!t.closest('button, a, .al-full')) openLightbox(dish);
    return;
  }
  // Allergen-Buchstaben in der kleinen Karte: Karte öffnen (zeigt dann die Allergene ausgeschrieben)
  const smallAl = dish && !dish.classList.contains('is-open') && t.closest('.al-btn');
  if (!smallAl && t.closest('button, a, .al-full')) return;
  if (dish) toggleDish(dish);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const dish = e.target as HTMLElement;
  if (!dish.matches?.('[data-dish]')) return;
  e.preventDefault();
  if (mqSmall.matches) toggleDish(dish); else openLightbox(dish);
});
mqSmall.addEventListener('change', () => {
  if (!mqSmall.matches) closeDishes(); else closeLightbox();
});

/* ---------------------------------------- Feste Reservieren-Leiste (Handy) */
(function bottomBar() {
  const bar = $('[data-bottom-bar]');
  const heroActions = $('.hero-actions');
  if (!bar) return;
  if (!heroActions || !('IntersectionObserver' in window)) return bar.classList.add('is-visible');
  new IntersectionObserver(([e]) => bar.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(heroActions);
})();

/* ------------------------------------------ Karte erst nach Einwilligung laden */
$$('[data-map-load]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const box = btn.closest<HTMLElement>('[data-map]')!;
    const iframe = document.createElement('iframe');
    iframe.src = box.dataset.src!;
    iframe.title = 'Google Maps';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    box.replaceChildren(iframe);
  })
);

/* -------------------------------------------------------------- Galerie */
(function lightbox() {
  const dlg = $<HTMLDialogElement>('[data-lightbox-dialog]');
  const img = $<HTMLImageElement>('[data-lightbox-img]');
  if (!dlg || !img || typeof dlg.showModal !== 'function') return;
  $$('[data-lightbox]').forEach((b) =>
    b.addEventListener('click', () => {
      img.src = b.dataset.full!;
      img.alt = b.dataset.alt || '';
      dlg.showModal();
    })
  );
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target === img) dlg.close(); });
})();

/* ---------------------------------------------------- Sanfte Einblendungen */
(function reveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) return els.forEach((el) => el.classList.add('in'));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach((el) => io.observe(el));
})();

/* ------------------------------------------- AR: Gericht auf dem Tisch ansehen */
(function arView() {
  const dlg = $<HTMLDialogElement>('#ar-dialog');
  const stage = $('[data-ar-stage]');
  const btns = $$<HTMLButtonElement>('[data-ar]');
  if (!dlg || !stage || !btns.length || typeof dlg.showModal !== 'function') return;
  const title = $('[data-ar-title]', dlg)!;
  const place = $<HTMLButtonElement>('[data-ar-place]', dlg)!;
  const hintMobile = $('[data-ar-hint-mobile]', dlg)!;
  const hintDesktop = $('[data-ar-hint-desktop]', dlg)!;
  const note = $('[data-ar-note]', dlg)!;

  // Google <model-viewer> erst beim ersten Klick laden (≈ 300 KB) – kein Einfluss auf Lighthouse
  const MV_URL = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js';
  let loading: Promise<void> | undefined;
  const loadViewer = () =>
    (loading ??= customElements.get('model-viewer')
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.type = 'module';
          s.src = MV_URL;
          s.onload = () => customElements.whenDefined('model-viewer').then(() => resolve());
          s.onerror = () => { loading = undefined; reject(new Error('model-viewer')); };
          document.head.append(s);
        }));

  type MV = HTMLElement & { canActivateAR?: boolean; activateAR?: () => void };
  let mv: MV | undefined;

  const show = async (b: HTMLButtonElement) => {
    title.textContent = b.dataset.arName || '';
    note.hidden = !!b.dataset.arScan; // Hinweis „Symbolbild“ nur bei automatisch erzeugten Tellern
    place.hidden = hintMobile.hidden = hintDesktop.hidden = true;
    stage.classList.add('is-loading');
    dlg.showModal();
    try { await loadViewer(); } catch { stage.classList.remove('is-loading'); return; }
    if (!mv) {
      mv = document.createElement('model-viewer') as MV;
      const attrs: Record<string, string> = {
        ar: '', 'ar-modes': 'webxr scene-viewer quick-look', 'ar-scale': 'fixed', 'ar-placement': 'floor',
        'camera-controls': '', 'touch-action': 'pan-y', 'auto-rotate': '', 'auto-rotate-delay': '0',
        'rotation-per-second': '18deg', 'shadow-intensity': '1', 'shadow-softness': '0.8',
        exposure: '1.05', 'environment-image': 'neutral', 'camera-orbit': '0deg 50deg auto',
        'interaction-prompt': 'none',
      };
      for (const [k, v] of Object.entries(attrs)) mv.setAttribute(k, v);
      // Eigener Button statt des Standard-Buttons von model-viewer
      const hidden = document.createElement('span');
      hidden.slot = 'ar-button';
      hidden.hidden = true;
      mv.append(hidden);
      mv.addEventListener('load', () => {
        stage.classList.remove('is-loading');
        const ar = !!mv!.canActivateAR;
        place.hidden = hintMobile.hidden = !ar;
        hintDesktop.hidden = ar;
      });
      stage.append(mv);
    }
    mv.setAttribute('alt', b.dataset.arName || '');
    if (b.dataset.arIos) mv.setAttribute('ios-src', b.dataset.arIos); else mv.removeAttribute('ios-src');
    if (mv.getAttribute('src') === b.dataset.ar) stage.classList.remove('is-loading');
    mv.setAttribute('src', b.dataset.ar!);
  };

  btns.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); show(b); }));
  place.addEventListener('click', () => mv?.activateAR?.());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
