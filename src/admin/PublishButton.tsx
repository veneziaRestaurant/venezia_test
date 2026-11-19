/**
 * Button „نشر على الإنترنت" in der Admin-Oberfläche (Keystatic).
 * Wird über ui.brand.mark in keystatic.config.ts eingehängt und schwebt unten links über der Oberfläche.
 * Spricht mit scripts/publish-plugin.mjs (nur lokal bei `npm run admin`).
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type Phase = 'idle' | 'publishing' | 'building' | 'done' | 'error';
interface Status { changes: number; ahead: number; siteUrl?: string }

const API = '/__venezia';
let mounted = 0; // nur ein Widget, auch wenn das Logo mehrfach gerendert wird

export function BrandMark() {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    if (mounted > 0) return;
    mounted++;
    setOwner(true);
    return () => { mounted--; };
  }, []);
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 999,
          background: '#2b1a12', color: '#c49a52', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16,
        }}
      >V</span>
      {owner && typeof document !== 'undefined' && createPortal(<PublishWidget />, document.body)}
    </>
  );
}

function PublishWidget() {
  const [st, setSt] = useState<Status | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(true);
  const timer = useRef<number>();

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API}/status`, { cache: 'no-store' });
      if (r.ok) setSt(await r.json());
    } catch { /* Server nicht erreichbar – ignorieren */ }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 4000);
    return () => { window.clearInterval(id); window.clearTimeout(timer.current); };
  }, [refresh]);

  async function watchDeploy(sha: string, started = Date.now()) {
    try {
      const r = await fetch(`${API}/deploy?sha=${sha}`, { cache: 'no-store' });
      const d = await r.json();
      if (d.status === 'completed') {
        if (d.conclusion === 'success') {
          setPhase('done');
          setMsg('✅ تم! التغييرات ظاهرة الآن على الموقع (قد تحتاج لتحديث الصفحة).');
        } else {
          setPhase('error');
          setMsg('❌ فشل بناء الموقع. غالباً بسبب خطأ في البيانات (مثلاً سعر غير صحيح). أبلغ المطوّر.');
        }
        return;
      }
    } catch { /* weiter versuchen */ }
    if (Date.now() - started > 10 * 60 * 1000) {
      setPhase('done');
      setMsg('تم الإرسال. يجب أن تظهر التغييرات خلال دقائق.');
      return;
    }
    timer.current = window.setTimeout(() => watchDeploy(sha, started), 8000);
  }

  async function publish() {
    setPhase('publishing');
    setMsg('جارٍ الإرسال …');
    try {
      const r = await fetch(`${API}/publish`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || 'خطأ');
      await refresh();
      if (d.nothing) {
        setPhase('idle');
        setMsg('لا توجد تغييرات جديدة. هل ضغطت على „حفظ" أولاً؟');
        return;
      }
      setPhase('building');
      setMsg('⏳ تم الإرسال. جارٍ بناء الموقع … (عادةً 1–3 دقائق)');
      watchDeploy(d.sha);
    } catch (e) {
      setPhase('error');
      setMsg(`❌ لم ينجح النشر: ${(e as Error).message.split('\n').slice(-3).join(' ')}`);
    }
  }

  const pending = (st?.changes ?? 0) + (st?.ahead ?? 0);
  const busy = phase === 'publishing' || phase === 'building';

  const box: CSSProperties = {
    position: 'fixed', insetInlineEnd: 16, bottom: 16, zIndex: 2147483000, direction: 'rtl',
    fontFamily: 'system-ui, "Segoe UI", Tahoma, sans-serif', fontSize: 14, color: '#2b1a12',
  };

  if (!open) {
    return (
      <div style={box}>
        <button type="button" onClick={() => setOpen(true)} style={pill(pending > 0)} title="نشر على الإنترنت">
          🚀 {pending > 0 ? `نشر (${pending})` : 'نشر'}
        </button>
      </div>
    );
  }

  return (
    <div style={box}>
      <div
        role="region"
        aria-label="النشر على الإنترنت"
        style={{
          width: 300, maxWidth: 'calc(100vw - 32px)', background: '#fffcf6', border: '1px solid #e2d5c0', borderRadius: 14,
          boxShadow: '0 12px 32px -8px rgba(43,26,18,.35)', padding: 14, display: 'grid', gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 15 }}>النشر على الإنترنت</strong>
          <button type="button" onClick={() => setOpen(false)} aria-label="تصغير" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 18, color: '#6b5848' }}>–</button>
        </div>
        <p style={{ margin: 0, color: '#6b5848', lineHeight: 1.5 }}>
          {st === null
            ? '…'
            : pending > 0
              ? `${st.changes > 0 ? `${st.changes} ملف/ملفات محفوظة` : 'تغييرات محفوظة'} بانتظار النشر.`
              : 'كل التغييرات المحفوظة منشورة.'}
          <br />
          <small>١. اضغط „حفظ" في الصفحة &nbsp;٢. ثم اضغط „نشر".</small>
        </p>
        <button type="button" onClick={publish} disabled={busy} style={{ ...pill(pending > 0), width: '100%', opacity: busy ? 0.7 : 1, cursor: busy ? 'wait' : 'pointer' }}>
          {phase === 'publishing' ? '… جارٍ الإرسال' : phase === 'building' ? '⏳ جارٍ البناء …' : '🚀 نشر على الإنترنت'}
        </button>
        {msg && (
          <p role="status" style={{ margin: 0, lineHeight: 1.5, color: phase === 'error' ? '#a8432a' : phase === 'done' ? '#3f6b20' : '#2b1a12' }}>
            {msg}
          </p>
        )}
        {st?.siteUrl && (
          <a href={st.siteUrl} target="_blank" rel="noopener" style={{ color: '#a8432a', fontSize: 13 }}>
            فتح الموقع ↗
          </a>
        )}
      </div>
    </div>
  );
}

function pill(active: boolean): CSSProperties {
  return {
    border: 0, borderRadius: 999, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    background: active ? '#a8432a' : '#2b1a12', color: '#fff', boxShadow: '0 4px 14px -4px rgba(0,0,0,.35)',
    fontFamily: 'inherit',
  };
}
