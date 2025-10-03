import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeKey } from '../utils/themeUtils';
import { Smile, HeartHandshake, BotOff, PartyPopper } from 'lucide-react';

// Google Form submission endpoint and entry IDs
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc9Cb3cU5ifmk7ymHTrMPhLpvHJ8a-_WXOQFPkpDhwQZWVlwQ/formResponse';
const FORMSUBMIT_FALLBACK = 'https://formsubmit.co/ajax/3b648867dccdbbc25deec547a473850f';

// Lightweight canvas confetti
const ConfettiCanvas: React.FC<{ className?: string; durationMs?: number }> = ({ className = '', durationMs = 4000 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let originX = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      // keep origin centered on resize
      originX = canvas.width / 2;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    type P = { x:number;y:number;vx:number;vy:number;w:number;h:number;rot:number;vr:number;color:string;life:number };
    const colors = ['#fde047','#60a5fa','#f472b6','#34d399','#fca5a5','#c084fc'];
    const rand = (a:number,b:number)=>a+Math.random()*(b-a);
    const particles:P[] = [];
    const measureOrigin = () => {
      originX = canvas.width/2; // single point at bottom center
    };
    measureOrigin();
    const spawn = (n:number)=>{
      for (let i=0;i<n;i++){
        // launch in a cone upwards for a natural confetti spray
        const angle = rand((-135*Math.PI)/180, (-45*Math.PI)/180); // wider cone: -90deg +/- 45deg
        const speed = rand(5, 8);
        particles.push({
          x: originX + rand(-6, 6),
          y: canvas.height + rand(12, 120),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: rand(6,10),
          h: rand(10,16),
          rot: rand(0,Math.PI*2),
          vr: rand(-0.2,0.2),
          color: colors[(Math.random()*colors.length)|0],
          life: rand(0.8,1)
        });
      }
    };
    // Lighter initial stream
    spawn(50);

    // movie credits feel: steady upward motion, slightly varying
    const gravity = -0.03;
    const drag = 0.997;

    const step = (t:number)=>{
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      ctx.clearRect(0,0,canvas.width,canvas.height);

      if (elapsed < durationMs) {
        // lighter, natural, intermittent bursts
        if (Math.random() < 0.02) spawn(3);
      }

      particles.forEach((p, idx)=>{
        p.vx *= drag;
        p.vy = p.vy*drag + gravity;
        // subtle horizontal sway for a more natural feel
        const sway = Math.sin((p.y + t*0.12 + idx) / 18) * 0.8;
        p.x += p.vx + sway;
        p.y += p.vy;
        p.rot += p.vr;
      });

      // draw
      particles.forEach((p)=>{
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        ctx.restore();
        p.life -= 0.004;
      });

      // remove offscreen/expired
      for (let i=particles.length-1;i>=0;i--) {
        const p = particles[i];
        if (p.y + p.h < 0 || p.life <= 0) particles.splice(i,1);
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [durationMs]);

  return <canvas ref={canvasRef} className={className} />;
};

interface FeedbackFormProps {
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  effectiveMode: 'light' | 'dark';
  colors: any;
}

const SlideContainer: React.FC<{ children: React.ReactNode; colors: any; bottomLeft?: React.ReactNode }>=({ children, colors, bottomLeft })=>{
  return (
    <div className={`w-full rounded-xl ${colors.container} ${colors.text} border ${colors.softBorder} shadow-inner overflow-hidden min-h-[560px] sm:min-h-[640px] p-10 sm:p-14 flex flex-col justify-center relative`}>
      {/* overlay tinted with button color at 50% opacity */}
      <div className={`absolute inset-0 rounded-xl ${colors.buttonAccent} opacity-50 z-0 pointer-events-none`} />
      <div className="relative z-10">
        {children}
      </div>
      {bottomLeft && (
        <div className={`absolute left-0 bottom-0 pl-10 pb-10 sm:pl-14 sm:pb-14 z-10`}>
          {bottomLeft}
        </div>
      )}
    </div>
  );
};

const PrimaryButton: React.FC<{ className?: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean; colors: any }> = ({ className = '', children, colors, ...rest }) => {
  return (
    <button
      className={`px-6 py-3 rounded-lg ${colors.buttonAccent} ${colors.buttonAccentHover} disabled:opacity-50 disabled:cursor-not-allowed font-medium ${colors.buttonText} focus-visible:outline-none focus-visible:ring-2 focus-visible:${colors.accent} focus-visible:ring-offset-2 transform-gpu transition-colors transition-transform duration-200 hover:scale-105 focus:scale-105 active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

const RatingButton: React.FC<{ active: boolean; onClick: () => void; label: string; colors: any }> = ({ active, onClick, label, colors }) => {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`w-12 h-12 rounded-lg font-bold text-lg inline-flex items-center justify-center transition-all border ${colors.softBorder} focus-visible:outline-none focus-visible:ring-2 focus-visible:${colors.accent} focus-visible:ring-offset-2 ${
        active ? `${colors.buttonAccent} ${colors.buttonText} scale-110 border-transparent` : `${colors.buttonSecondary} ${colors.buttonSecondaryHover}`
      }`}
    >
      {label}
    </button>
  );
};

const SlideContent: React.FC<{ children: React.ReactNode; exiting?: boolean }>=({ children, exiting })=>{
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{
    const id = requestAnimationFrame(()=> setMounted(true));
    return ()=> cancelAnimationFrame(id);
  },[]);
  const base = 'transition-all duration-300 ease-out transform';
  const cls = exiting
    ? '-translate-y-3'
    : (mounted ? 'translate-y-0' : 'translate-y-3');
  return <div className={`${base} ${cls}`}>{children}</div>;
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({ colors }) => {
  const [step, setStep] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [howToTen, setHowToTen] = useState('');
  const [anythingElse, setAnythingElse] = useState('');
  // Screenshot upload removed (FormSubmit doesn't support attachments reliably via AJAX)
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const [goPop, setGoPop] = useState(false);
  const [wantsContact, setWantsContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  // Track which steps the user completed for Google Forms checkbox field
  const completedSteps = useRef<Set<string>>(new Set(['WelcomeScreen']));
  // Honeypot field for spam detection
  const [companyWebsite, setCompanyWebsite] = useState('');
  // Shake animation for validation errors
  const [shakeButton, setShakeButton] = useState(false);
  // Deduplicate autosends
  const lastSentHashRef = useRef<string | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (displayStep === 2 || displayStep === 3) {
      // Autofocus textarea on text slides
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [displayStep]);

  const nextStepFrom = useCallback((s: number): number => {
    switch (s) {
      case 0: return 1;
      case 1: return rating !== null && rating === 10 ? 3 : 2; // skip "how to 10" if rating is 10
      case 2: return 3;
      case 3: return 4;
      case 4: return 5;
      default: return 5;
    }
  }, [rating]);

  const GO_ANIM_MS = 260;
  const goTo = useCallback((target: number) => {
    if (target === displayStep) return;
    setIsExiting(true);
    setTimeout(() => {
      setDisplayStep(target);
      setIsExiting(false);
      setStep(target);
    }, GO_ANIM_MS);
  }, [displayStep]);

  // Allowed checkbox option texts in Google Form (must match exactly)
  const ALLOWED_COMPLETED = useRef<Set<string>>(new Set([
    'WelcomeScreen',
    'What do you rate SchoolPlanner out of 10?',
    "Anything else you'd like to say?",
    'Want us to contact you on your feedback?',
  ]));

  // Build URL-encoded params for Google Forms (more reliable than multipart in some cases)
  const buildGoogleParams = (): URLSearchParams => {
    const p = new URLSearchParams();
    if (rating !== null) p.append('entry.1955256693', String(rating));
    if (rating !== null && rating < 10) p.append('entry.928581443', howToTen);
    p.append('entry.1873298085', anythingElse);
    const willSendEmail = Boolean(contactEmail.trim());
    if (willSendEmail) p.append('entry.814650867', contactEmail.trim());
    completedSteps.current.forEach(stepName => {
      if (ALLOWED_COMPLETED.current.has(stepName)) p.append('entry.895264206', stepName);
    });
    // Do NOT append a 'submit' param; it can shadow form.submit() when used via DOM
    return p;
  };

  // Try to fetch hidden tokens (fbzx, fvv, pageHistory) from the viewform via CORS-friendly proxies
  const fetchGoogleTokens = async (): Promise<{ fbzx: string; fvv: string; pageHistory: string } | null> => {
    const viewUrl = GOOGLE_FORM_URL.replace('formResponse', 'viewform');
    const candidates = [
      (u: string) => `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ];
    for (const wrap of candidates) {
      const url = wrap(viewUrl);
      try {
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) continue;
        const html = await res.text();
        const fbzx = (html.match(/name="fbzx"\s+value="([^"]+)"/) || [])[1];
        const fvv = (html.match(/name="fvv"\s+value="([^"]+)"/) || [])[1];
        const pageHistory = (html.match(/name="pageHistory"\s+value="([^"]+)"/) || [])[1];
        if (fbzx && fvv && pageHistory) {
          return { fbzx, fvv, pageHistory };
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  };

  // Submit to Google using DOM form; include tokens if we can fetch them
  // Returns true if a DOM submit was attempted successfully
  const submitGoogleDOMWithOptionalTokens = async (baseParams: URLSearchParams): Promise<boolean> => {
    try {
      const tokens = await fetchGoogleTokens();
      if (tokens) {
        const tokenParams = new URLSearchParams();
        baseParams.forEach((v, k) => tokenParams.append(k, v));
        tokenParams.append('fvv', tokens.fvv);
        tokenParams.append('fbzx', tokens.fbzx);
        tokenParams.append('pageHistory', tokens.pageHistory);
        return await submitGoogleViaFormDOMWithParams(tokenParams);
      }
      return await submitGoogleViaFormDOMWithParams(baseParams);
    } catch (e) {
      return await submitGoogleViaFormDOMWithParams(baseParams);
    }
  };

  // Submit to Google Forms using a hidden form + iframe (works even when fetch is blocked)
  const submitGoogleViaFormDOM = async (): Promise<boolean> => {
    try {
      const params = buildGoogleParams();
      return await submitGoogleDOMWithOptionalTokens(params);
    } catch { return false; }
  };

  // Variant that accepts arbitrary params (for cached autosend on mount)
  const submitGoogleViaFormDOMWithParams = (params: URLSearchParams): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        let iframe = document.getElementById('feedback-google-iframe') as HTMLIFrameElement | null;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.name = 'feedback-google-iframe';
          iframe.id = 'feedback-google-iframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = GOOGLE_FORM_URL;
        form.target = 'feedback-google-iframe';
        form.acceptCharset = 'UTF-8';
        params.forEach((value, key) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        (HTMLFormElement.prototype.submit.call as any)(form);
        let settled = false;
        const cleanup = (ok: boolean) => {
          try { if (form.isConnected) document.body.removeChild(form); } catch { /* ignore */ }
          try { iframe?.removeEventListener('load', onLoad); } catch { /* ignore */ }
          if (!settled) { settled = true; resolve(ok); }
        };
        const onLoad = () => cleanup(true);
        try { iframe?.addEventListener('load', onLoad, { once: true }); } catch { /* ignore */ }
        setTimeout(() => cleanup(true), 1500);
      } catch { resolve(false); }
    });
  };

  // (Removed fetch-based Google submit to avoid noisy 400s; we rely on DOM form submission.)

  const submitToFormSubmit = async (isAutoSubmit: boolean): Promise<boolean> => {
    try {
      const fsfd = new FormData();
      if (rating !== null) fsfd.append('rating', String(rating));
      if (rating !== null && rating < 10) fsfd.append('how_to_get_to_10', howToTen);
      fsfd.append('comments', anythingElse);
      if (wantsContact && contactEmail.trim()) {
        fsfd.append('email', contactEmail.trim());
      }
      fsfd.append('completion', Array.from(completedSteps.current).join(', '));
      fsfd.append('_captcha', 'false');
      fsfd.append('_subject', isAutoSubmit ? 'SchoolPlanner Feedback (Auto-saved)' : 'SchoolPlanner Feedback');
      fsfd.append('_template', 'table');
      fsfd.append('_honey', companyWebsite);
      fsfd.append('timestamp', new Date().toISOString());

      const res = await fetch(FORMSUBMIT_FALLBACK, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fsfd,
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const submitForm = async (isAutoSubmit: boolean = false) => {
    // Check honeypot - if filled, it's spam
    if (companyWebsite.trim()) return;

    if (!isAutoSubmit && (hasSubmittedRef.current || submittingRef.current)) return;

    try {
      if (!isAutoSubmit) {
        setError(null);
        setSubmitting(true);
        submittingRef.current = true;
      }

      // For manual submits: try Google first; only use FormSubmit if Google attempt failed
      const googleOk = await submitGoogleViaFormDOM();
      if (!googleOk) await submitToFormSubmit(isAutoSubmit);

      if (!isAutoSubmit) {
        hasSubmittedRef.current = true;
        goTo(5);
      }
    } catch (e: any) {
      if (!isAutoSubmit) setError('Submission failed. Please try again in a moment.');
    } finally {
      if (!isAutoSubmit) {
        setSubmitting(false);
        submittingRef.current = false;
      }
    }
  };

  const next = useCallback(() => {
    setError(null);
    setShakeButton(false);
    
    if (step === 1 && rating === null) {
      setError('This question is required');
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);
      return;
    }
    // Track completion when user proceeds (values must match Google Form options exactly)
    if (step === 1) {
      completedSteps.current.add('What do you rate SchoolPlanner out of 10?');
    } else if (step === 3) {
      completedSteps.current.add('Anything else you\'d like to say?');
    } else if (step === 4) {
      completedSteps.current.add('Want us to contact you on your feedback?');
    }

    // Validate step 2 if rating < 10
    if (step === 2 && rating !== null && rating < 10 && !howToTen.trim()) {
      setError('This question is required');
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);
      return;
    }

    // If on contact step, validate and submit
    if (step === 4) {
      if (wantsContact && !contactEmail.trim()) {
        setError('Email address is required');
        setShakeButton(true);
        setTimeout(() => setShakeButton(false), 500);
        return;
      }
      submitForm(false);
      return;
    }

    const target = nextStepFrom(step);
    goTo(target);
  }, [step, rating, howToTen, anythingElse, wantsContact, contactEmail, companyWebsite, nextStepFrom, goTo]);

  // Pop animation then advance
  const handleGo = useCallback(() => {
    setGoPop(true);
    setTimeout(() => setGoPop(false), 180);
    next();
  }, [next]);

  const handlePickRating = (n: number) => {
    setRating(n);
    // Mark rating question as completed when chosen
    if (step === 1) {
      completedSteps.current.add('What do you rate SchoolPlanner out of 10?');
    }
    setTimeout(() => {
      if (step === 1) {
        goTo(n === 10 ? 3 : 2);
      }
    }, 220);
  };

  // Save to cache helper
  const saveToCache = useCallback(() => {
    const formState = {
      rating,
      howToTen,
      anythingElse,
      wantsContact,
      contactEmail,
      completedSteps: Array.from(completedSteps.current),
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('feedbackFormCache', JSON.stringify(formState));
    } catch (e) { /* ignore */ }
  }, [rating, howToTen, anythingElse, wantsContact, contactEmail]);

  // Load cached data on mount and auto-send (guarded to once per load)
  useEffect(() => {
    const cached = localStorage.getItem('feedbackFormCache');
    if (!cached || hasSubmittedRef.current) return;
    // Prevent duplicate sends (e.g., StrictMode double-mount)
    if (localStorage.getItem('feedbackFormCache_sending') === '1') return;
    localStorage.setItem('feedbackFormCache_sending', '1');
    try {
      const formState = JSON.parse(cached);
      // Build URL-encoded Google payload from cached snapshot
      const params = new URLSearchParams();
      if (formState.rating !== null) params.append('entry.1955256693', String(formState.rating));
      if (formState.rating !== null && formState.rating < 10) params.append('entry.928581443', formState.howToTen || '');
      params.append('entry.1873298085', formState.anythingElse || '');
      if (formState.wantsContact && formState.contactEmail) params.append('entry.814650867', formState.contactEmail);
      (formState.completedSteps || []).forEach((step: string) => {
        if (ALLOWED_COMPLETED.current.has(step)) params.append('entry.895264206', step);
      });
      (async () => {
        const googleOk = await submitGoogleDOMWithOptionalTokens(params);
        if (!googleOk) {
          const fsfd = new FormData();
          if (formState.rating !== null) fsfd.append('rating', String(formState.rating));
          if (formState.rating !== null && formState.rating < 10) fsfd.append('how_to_get_to_10', formState.howToTen || '');
          fsfd.append('comments', formState.anythingElse || '');
          if (formState.wantsContact && formState.contactEmail) fsfd.append('email', formState.contactEmail);
          fsfd.append('completion', (formState.completedSteps || []).join(', '));
          fsfd.append('_captcha', 'false');
          fsfd.append('_subject', 'SchoolPlanner Feedback (Auto-saved)');
          fsfd.append('_template', 'table');
          fsfd.append('_honey', '');
          fsfd.append('timestamp', new Date(formState.timestamp).toISOString());
          await fetch(FORMSUBMIT_FALLBACK, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fsfd });
        }
        localStorage.removeItem('feedbackFormCache');
        localStorage.removeItem('feedbackFormCache_sending');
      })();
    } catch (e) {
      localStorage.removeItem('feedbackFormCache_sending');
    }
  }, []);

  // Immediate background autosend helper (used on SPA navigation)
  const sendAutoNow = useCallback(() => {
    try {
      const snapshot = {
        rating,
        howToTen: rating !== null && rating < 10 ? howToTen : '',
        anythingElse,
        wantsContact,
        contactEmail,
        completedSteps: Array.from(completedSteps.current).sort(),
      };
      const hash = JSON.stringify(snapshot);
      if (hash === lastSentHashRef.current) return; // no changes since last send
      lastSentHashRef.current = hash;

      // Send via DOM (primary), fallback to FormSubmit only on failure
      const params = buildGoogleParams();
      (async () => {
        const googleOk = await submitGoogleDOMWithOptionalTokens(params);
        if (!googleOk) {
          const fsfd2 = new FormData();
          if (rating !== null) fsfd2.append('rating', String(rating));
          if (rating !== null && rating < 10) fsfd2.append('how_to_get_to_10', howToTen || '');
          fsfd2.append('comments', anythingElse || '');
          if (wantsContact && contactEmail.trim()) fsfd2.append('email', contactEmail.trim());
          fsfd2.append('completion', Array.from(completedSteps.current).join(', '));
          fsfd2.append('_captcha', 'false');
          fsfd2.append('_subject', 'SchoolPlanner Feedback (Auto-saved)');
          fsfd2.append('_template', 'table');
          fsfd2.append('_honey', companyWebsite);
          fsfd2.append('timestamp', new Date().toISOString());
          await fetch(FORMSUBMIT_FALLBACK, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fsfd2 });
        }
      })();
    } catch {}
  }, [rating, howToTen, anythingElse, wantsContact, contactEmail, companyWebsite]);

  // Save to cache on beforeunload (tab close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step > 0 && step < 5 && !hasSubmittedRef.current) {
        saveToCache();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, saveToCache]);

  // Save to cache and autosend on SPA navigations (pushState/replaceState) and back/forward (popstate)
  useEffect(() => {
    const onNav = () => {
      if (step > 0 && step < 5 && !hasSubmittedRef.current) {
        // write cache for resilience, and send immediately in background
        saveToCache();
        sendAutoNow();
      }
    };
    // Hook history to catch client-side navigations
    const h: any = window.history as any;
    const origPush = h.pushState;
    const origReplace = h.replaceState;
    h.pushState = function (...args: any[]) {
      origPush.apply(this, args);
      onNav();
    };
    h.replaceState = function (...args: any[]) {
      origReplace.apply(this, args);
      onNav();
    };
    window.addEventListener('popstate', onNav);
    return () => {
      // restore
      h.pushState = origPush;
      h.replaceState = origReplace;
      window.removeEventListener('popstate', onNav);
    };
  }, [step, saveToCache, sendAutoNow]);

  // Send immediately when clicking same-site <a> links (non-SPA navigations)
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (step <= 0 || step >= 5 || hasSubmittedRef.current) return;
      const target = ev.target as HTMLElement | null;
      let el: HTMLElement | null = target;
      let anchor: HTMLAnchorElement | null = null;
      while (el) {
        if (el.tagName === 'A') { anchor = el as HTMLAnchorElement; break; }
        el = el.parentElement;
      }
      if (!anchor) return;
      // Ignore if explicit new tab or download
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return; // external link
        // Same-site navigation: cache and send immediately
        saveToCache();
        sendAutoNow();
      } catch {}
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [step, saveToCache, sendAutoNow]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (submittingRef.current) return;
    if (displayStep === 0 && e.key === 'Enter') {
      e.preventDefault();
      goTo(1);
    }
    if ((displayStep === 2 || displayStep === 3 || displayStep === 4) && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      next();
    }
  };

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      {/* Honeypot field - hidden, for spam detection */}
      <input
        type="text"
        name="company_website"
        value={companyWebsite}
        onChange={(e) => setCompanyWebsite(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {displayStep === 0 && (
        <SlideContainer
          colors={colors}
          bottomLeft={(
            <div className={`flex items-center gap-2 ${colors.text} text-xs`}>
              <BotOff className="w-4 h-4" aria-hidden />
              <span>Spam protection enabled</span>
            </div>
          )}
        >
          <SlideContent exiting={isExiting}>
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              Hey there <Smile aria-hidden className="w-8 h-8" />
            </h2>
            <p className={`${colors.text} text-lg flex items-center gap-2 justify-center`}>
              Got 2 minutes? We'd love for you to fill out this form <HeartHandshake aria-hidden className="w-6 h-6" />
            </p>
            <div className="flex items-center justify-center gap-3">
              <PrimaryButton className={goPop ? 'scale-110' : ''} onClick={handleGo} colors={colors}>Let's go</PrimaryButton>
            </div>
          </div>
          </SlideContent>
        </SlideContainer>
      )}

      {displayStep === 1 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="space-y-8">
            <h3 className="text-3xl sm:text-4xl font-bold">How would you rate School Planner from a score of 1 to 10? <span className={colors.text}>*</span></h3>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <RatingButton key={n} label={String(n)} active={rating === n} onClick={() => handlePickRating(n)} colors={colors} />
              ))}
            </div>
            <div className="relative">
              <PrimaryButton 
                onClick={next} 
                disabled={rating === null} 
                colors={colors}
                className={shakeButton ? 'animate-shake' : ''}
              >
                Next
              </PrimaryButton>
              {error && (
                <div className="absolute -bottom-8 left-0 bg-red-500 text-white text-sm px-3 py-1 rounded shadow-lg animate-fadeIn">
                  {error}
                </div>
              )}
            </div>
          </div>
          </SlideContent>
        </SlideContainer>
      )}

      {displayStep === 2 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="space-y-4">
            <h3 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">How do we get to 10? <span className={colors.text}>*</span></h3>
            <textarea
              ref={textAreaRef}
              value={howToTen}
              onChange={(e) => setHowToTen(e.target.value)}
              placeholder="Better UI, less laggy, etc"
              className={`w-full h-40 rounded-lg ${colors.input} ${colors.inputBorder} focus:outline-none focus:ring-2 focus:${colors.accent} p-4 ${colors.placeholder}`}
            />
            <div className="flex items-center gap-3 relative">
              <PrimaryButton 
                onClick={next} 
                colors={colors}
                className={shakeButton ? 'animate-shake' : ''}
              >
                Next
              </PrimaryButton>
              <span className={`${colors.textSecondary} text-sm`}>press Ctrl + Enter ↵</span>
              {error && (
                <div className="absolute -bottom-8 left-0 bg-red-500 text-white text-sm px-3 py-1 rounded shadow-lg animate-fadeIn whitespace-nowrap">
                  {error}
                </div>
              )}
            </div>
          </div>
          </SlideContent>
        </SlideContainer>
      )}

      {displayStep === 3 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="space-y-4">
            <h3 className="text-3xl sm:text-4xl font-bold">Anything else you'd like to say?</h3>
            <textarea
              ref={textAreaRef}
              value={anythingElse}
              onChange={(e) => setAnythingElse(e.target.value)}
              placeholder="Your answer here..."
              className={`w-full h-40 rounded-lg ${colors.input} ${colors.inputBorder} focus:outline-none focus:ring-2 focus:${colors.accent} p-4 ${colors.placeholder}`}
            />
            <div className="flex items-center gap-3">
              <PrimaryButton onClick={next} colors={colors}>Next</PrimaryButton>
              <span className={`${colors.textSecondary} text-sm`}>press Ctrl + Enter ↵</span>
            </div>
          </div>
          </SlideContent>
        </SlideContainer>
      )}

      {displayStep === 4 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="space-y-4">
            <h3 className="text-3xl sm:text-4xl font-bold">Want us to contact you on your feedback?</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={wantsContact}
                    onChange={(e) => setWantsContact(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 ${colors.border} peer-checked:${colors.buttonAccent} peer-checked:border-transparent transition-all flex items-center justify-center`}>
                    {wantsContact && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`text-lg ${colors.text}`}>Yes, please contact me</span>
              </label>
              {wantsContact && (
                <div className="space-y-2 animate-fadeIn">
                  <label className={`block text-sm font-medium ${colors.text}`}>Your Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className={`w-full px-4 py-3 rounded-lg ${colors.input} ${colors.inputBorder} focus:outline-none focus:ring-2 focus:${colors.accent} ${colors.placeholder}`}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 relative">
              <PrimaryButton 
                onClick={next} 
                disabled={submitting} 
                colors={colors}
                className={shakeButton ? 'animate-shake' : ''}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </PrimaryButton>
              <span className={`${colors.textSecondary} text-sm`}>press Ctrl + Enter ↵</span>
              {error && (
                <div className="absolute -bottom-8 left-0 bg-red-500 text-white text-sm px-3 py-1 rounded shadow-lg animate-fadeIn whitespace-nowrap">
                  {error}
                </div>
              )}
            </div>
          </div>
          </SlideContent>
        </SlideContainer>
      )}
      

      {displayStep === 5 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="text-center space-y-6">
            <h3 className="text-4xl sm:text-5xl font-extrabold flex items-center gap-2 justify-center">Thank you! <PartyPopper aria-hidden className="w-8 h-8" /></h3>
            <p className={`${colors.textSecondary} text-lg`}>We appreciate your feedback.</p>
          </div>
          </SlideContent>
          <ConfettiCanvas className="absolute inset-0 pointer-events-none" />
        </SlideContainer>
      )}
    </div>
  );
};

export default FeedbackForm;
