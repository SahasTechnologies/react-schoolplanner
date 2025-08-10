import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeKey } from '../utils/themeUtils';

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

const FORM_ENDPOINT = 'https://formsubmit.co/ajax/42c917da0328f31b1dea91f093a6778e';

interface FeedbackFormProps {
  theme: ThemeKey;
  themeType: 'normal' | 'extreme';
  effectiveMode: 'light' | 'dark';
  colors: any;
}

const SlideContainer: React.FC<{ children: React.ReactNode; colors: any }>=({ children, colors })=>{
  return (
    <div className={`w-full rounded-xl ${colors.container} ${colors.text} shadow-inner overflow-hidden min-h-[560px] sm:min-h-[640px] p-10 sm:p-14 flex flex-col justify-center relative`}>
      {children}
    </div>
  );
};

const PrimaryButton: React.FC<{ className?: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean; colors: any }> = ({ className = '', children, colors, ...rest }) => {
  return (
    <button
      className={`px-6 py-3 rounded-lg ${colors.buttonAccent} hover:${colors.buttonAccentHover} disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors ${colors.accentText} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

const RatingButton: React.FC<{ active: boolean; onClick: () => void; label: string; colors: any }> = ({ active, onClick, label, colors }) => {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
        active ? `${colors.buttonAccent} ${colors.accentText} scale-110` : `${colors.buttonSecondary} hover:${colors.buttonSecondaryHover}`
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
    ? 'opacity-0 -translate-y-3'
    : (mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3');
  return <div className={`${base} ${cls}`}>{children}</div>;
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({ theme, themeType, effectiveMode, colors }) => {
  const [step, setStep] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [howToTen, setHowToTen] = useState('');
  const [anythingElse, setAnythingElse] = useState('');
  // Screenshot upload removed (FormSubmit doesn't support attachments reliably via AJAX)
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // removed: wantsScreenshot & file upload UI
  const submittingRef = useRef(false);
  const hasSubmittedRef = useRef(false);

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
      case 1: return rating !== null && rating >= 9 ? 3 : 2;
      case 2: return 3;
      case 3: return 5; // submit from step 3 now
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

  const next = useCallback(() => {
    setError(null);
    if (step === 1 && rating === null) {
      setError('Please choose a rating.');
      return;
    }
    // If we are on the text step (step 3), submit now with the freshest textarea value.
    if (step === 3) {
      const finalText = textAreaRef.current?.value ?? anythingElse;
      submit(finalText);
      return;
    }
    const target = nextStepFrom(step);
    goTo(target);
  }, [step, rating, anythingElse, nextStepFrom, goTo]);

  const handlePickRating = (n: number) => {
    setRating(n);
    // slight delay for micro-interaction before transitioning
    setTimeout(() => {
      if (step === 1) {
        // use the clicked value to avoid any stale state
        goTo(n >= 9 ? 3 : 2);
      }
    }, 220);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (submittingRef.current) return; // ignore keyboard submits while submitting
    if (displayStep === 0 && e.key === 'Enter') {
      e.preventDefault();
      goTo(1);
    }
    if ((displayStep === 2 || displayStep === 3) && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (displayStep === 3) {
        const finalText = textAreaRef.current?.value ?? anythingElse;
        submit(finalText);
      } else next();
    }
  };

  // Simple retrying fetch with timeout for network resilience
  const fetchWithRetry = async (url: string, init: RequestInit, retries = 2, timeoutMs = 12000): Promise<Response> => {
    let lastErr: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(id);
        if (res.ok) return res;
        // Retry on 429 and 5xx
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastErr = new Error(`HTTP ${res.status}`);
        } else {
          return res; // don't retry on other statuses
        }
      } catch (e) {
        lastErr = e;
      } finally {
        clearTimeout(id);
      }
      // backoff before next attempt
      const delay = 500 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
    throw lastErr ?? new Error('Network error');
  };


  const submit = async (finalAnything?: string) => {
    if (hasSubmittedRef.current || submittingRef.current) return; // guard against duplicates
    try {
      setError(null);
      setSubmitting(true);
      submittingRef.current = true;
      const fd = new FormData();
      if (rating !== null) fd.append('rating', String(rating));
      // Always include how_to_get_to_10 so the field shows up in the email, even when rating >= 9
      fd.append('how_to_get_to_10', (rating !== null && rating < 9) ? howToTen : '');
      // Capture free text reliably: prefer state, fall back to current textarea value
      const comments = finalAnything ?? ((anythingElse ?? '').length ? anythingElse : (textAreaRef.current?.value ?? ''));
      // Send under both 'anything_else' and 'comments' for maximum compatibility/visibility in emails
      fd.append('anything_else', comments);
      fd.append('comments', comments);
      // Common formsubmit options
      fd.append('_captcha', 'false');
      fd.append('_subject', 'SchoolPlanner Feedback');
      fd.append('_template', 'table');
      // Honeypot (bots fill this; we leave blank)
      fd.append('_honey', '');
      // Timestamp
      fd.append('timestamp', new Date().toISOString());

      const res = await fetchWithRetry(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd,
      }, 2, 12000);
      if (!res.ok) throw new Error('Network response was not ok');
      // Optional: check JSON status
      // const data = await res.json();
      hasSubmittedRef.current = true;
      goTo(5);
    } catch (e:any) {
      console.error(e);
      setError('Submission failed. Please try again in a moment.');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      {displayStep === 0 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Hey there <span role="img" aria-label="smile">😃</span></h2>
            <p className={`${colors.textSecondary} text-lg`}>Got 2 minutes? We'd love for you to fill out this form <span role="img" aria-label="heart">💖</span></p>
            <div className="flex items-center justify-center gap-3">
              <PrimaryButton onClick={next} colors={colors}>Let's go</PrimaryButton>
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
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <RatingButton key={n} label={String(n)} active={rating === n} onClick={() => handlePickRating(n)} colors={colors} />
              ))}
            </div>
            <p className={`${colors.textSecondary} text-sm`}>This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</p>
            {error && <p className="text-red-200 text-sm">{error}</p>}
            <PrimaryButton onClick={next} disabled={rating === null} colors={colors}>Next</PrimaryButton>
          </div>
          </SlideContent>
        </SlideContainer>
      )}

      {displayStep === 2 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="space-y-4">
            <h3 className="text-3xl sm:text-4xl font-bold">How do we get to 10? <span role="img" aria-label="star">⭐</span></h3>
            <textarea
              ref={textAreaRef}
              value={howToTen}
              onChange={(e) => setHowToTen(e.target.value)}
              placeholder="Better UI, less laggy, etc"
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
              <PrimaryButton onClick={next} disabled={submitting} colors={colors}>{submitting ? 'Submitting…' : 'Submit'}</PrimaryButton>
              <span className={`${colors.textSecondary} text-sm`}>press Ctrl + Enter ↵</span>
            </div>
          </div>
          </SlideContent>
        </SlideContainer>
      )}
      

      {displayStep === 5 && (
        <SlideContainer colors={colors}>
          <SlideContent exiting={isExiting}>
          <div className="text-center space-y-6">
            <h3 className="text-4xl sm:text-5xl font-extrabold">Thank you! <span role="img" aria-label="hands">🙌</span></h3>
            <p className={`${colors.textSecondary} text-lg`}>We appreciate your feedback.</p>
          </div>
          </SlideContent>
          {/* Confetti spans the entire form container */}
          <ConfettiCanvas className="absolute inset-0 pointer-events-none" />
        </SlideContainer>
      )}
    </div>
  );
};

export default FeedbackForm;
