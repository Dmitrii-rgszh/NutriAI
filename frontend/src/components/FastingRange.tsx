import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Props { startHour: number; endHour: number; onChange: (s:number,e:number)=>void; }

const spanHours = (s:number,e:number)=> ((e - s + 24) % 24);

// Enhanced range: smooth (fractional) drag, snap on release, MAX eating 8h (fasting >=16h), haptics per hour.
const FastingRange: React.FC<Props> = ({ startHour, endHour, onChange }) => {
  const trackRef = useRef<HTMLDivElement|null>(null);
  const [drag, setDrag] = useState<null|'s'|'e'>(null);
  const [tempStart, setTempStart] = useState<number|null>(null); // fractional while dragging
  const [tempEnd, setTempEnd] = useState<number|null>(null);
  const tempStartRef = useRef<number>(startHour);
  const tempEndRef = useRef<number>(endHour);
  const lastBuzzRef = useRef<number|null>(null);

  const displayStart = tempStart ?? startHour;
  const displayEnd = tempEnd ?? endHour;
  const eating = spanHours(displayStart, displayEnd); // may be fractional during drag
  const fasting = 24 - eating;
  const MAX_EATING = 8; // hours
  const valid = fasting >= 16; // fasting must be >=16h now
  // crossing midnight handled when building segments; no explicit flag needed.

  const STEP = 0.5; // 30 minute шаг
  const posToFraction = (clientX:number, rect:DOMRect) => {
    const rel = Math.min(1, Math.max(0,(clientX - rect.left)/rect.width));
    let raw = rel * 24;
    if(raw >= 24) raw = 23.9999;
    // quantize to half-hour
    return Math.round(raw / STEP) * STEP;
  };

  const vibrateHour = (val:number) => {
    const h = Math.floor(val) % 24;
    if (lastBuzzRef.current === h) return;
    lastBuzzRef.current = h;
    try { (navigator as any)?.vibrate?.(8); } catch { /* ignore */ }
  };

  // Soft clamp approach: allow temporary violation while dragging (visual invalid state), enforce on release.

  const beginDrag = (which:'s'|'e') => (e:React.PointerEvent) => {
    e.preventDefault();
    // pointer capture to ensure continuous events even if leaving handle early
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    setDrag(which);
    tempStartRef.current = startHour;
    tempEndRef.current = endHour;
    setTempStart(startHour);
    setTempEnd(endHour);
    lastBuzzRef.current = which==='s'? startHour : endHour;
  };

  const updateDuringDrag = useCallback((clientX:number)=>{
    if(!drag || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let frac = posToFraction(clientX, rect);
    if (drag === 's') {
      tempStartRef.current = frac;
      setTempStart(frac);
      vibrateHour(frac);
    } else {
      tempEndRef.current = frac;
      setTempEnd(frac);
      vibrateHour(frac);
    }
  },[drag]);

  const onPointerMoveLocal = (e:React.PointerEvent) => {
    if(!drag) return;
    updateDuringDrag(e.clientX);
  };

  // Global listeners for smooth drag outside track
  useEffect(()=>{
    if(!drag) return;
    const move = (e:PointerEvent)=> updateDuringDrag(e.clientX);
    const up = ()=> {
      let finalS = Math.round((tempStartRef.current/STEP)) * STEP; if(finalS>=24) finalS-=24;
      let finalE = Math.round((tempEndRef.current/STEP)) * STEP; if(finalE>=24) finalE-=24;
      let span = spanHours(finalS, finalE);
      if (span > MAX_EATING) {
        if (drag === 's') finalS = (finalE - MAX_EATING + 24) % 24; else finalE = (finalS + MAX_EATING) % 24;
      }
      onChange(finalS, finalE);
      setTempStart(null); setTempEnd(null); setDrag(null); lastBuzzRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return ()=> { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  },[drag,updateDuringDrag,onChange]);

  // Keyboard (still snapped per hour)
  const key = (which:'s'|'e') => (e:React.KeyboardEvent) => {
    let d=0; if(e.key==='ArrowRight') d=1; else if(e.key==='ArrowLeft') d=-1; if(!d) return; e.preventDefault();
    const base = which==='s'? startHour : endHour;
    let nh = (base + d + 24) % 24;
    // enforce max 8h eating window (fasting >=16h)
    if (which==='s') {
      if (spanHours(nh, endHour) > MAX_EATING) nh = (endHour - MAX_EATING + 24) % 24;
      onChange(nh, endHour);
    } else {
      if (spanHours(startHour, nh) > MAX_EATING) nh = (startHour + MAX_EATING) % 24;
      onChange(startHour, nh);
    }
  };

  // Fallback minimal style (same as before) if needed
  useEffect(()=>{
    if (typeof document === 'undefined') return;
    if (document.getElementById('fasting-range-fallback-styles')) return;
    const style = document.createElement('style');
    style.id = 'fasting-range-fallback-styles';
  style.textContent = `/* FastingRange fallback (fractional) */\n.fast-line-wrap{display:flex;flex-direction:column;gap:.45rem;width:100%;}\n.fast-line{position:relative;height:16px;border-radius:8px;background:linear-gradient(90deg,#1f2933,#0f1a22);box-shadow:0 0 0 1px rgba(255,255,255,.15),0 2px 4px -1px rgba(0,0,0,.6) inset;overflow:visible;touch-action:none;}\n.fast-line.invalid{box-shadow:0 0 0 1px #92400e,0 0 6px 2px rgba(146,64,14,.5);}\n.fast-eating{position:absolute;top:0;bottom:0;background:linear-gradient(90deg,#4ade80,#2dd4bf 55%,#60a5fa);border-radius:8px;box-shadow:0 0 0 1px rgba(255,255,255,.3),0 0 14px 4px rgba(45,212,191,.4);}\n.fast-h{position:absolute;top:50%;transform:translate(-50%,-50%);width:50px;height:50px;background:linear-gradient(135deg,#10222c,#1c3642);border:2px solid #2dd4bf;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;letter-spacing:.5px;color:#e2e8f0;cursor:grab;box-shadow:0 0 0 2px #0f1115,0 0 12px 3px rgba(45,212,191,.4);z-index:2;touch-action:none;}\n.fast-h.drag,.fast-h:focus-visible{border-color:#60a5fa;outline:none;box-shadow:0 0 0 2px #0f1115,0 0 0 4px rgba(96,165,250,.4);}\n.fast-h span{background:linear-gradient(135deg,#4ade80,#2dd4bf 60%,#60a5fa);-webkit-background-clip:text;background-clip:text;color:transparent;}\n`;
    document.head.appendChild(style);
  },[]);

  const onTrackPointerDown = (e:React.PointerEvent) => {
    if(!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let frac = posToFraction(e.clientX, rect);
    // choose nearest handle by circular distance
    const circDist = (a:number,b:number)=>{ const d=Math.abs(a-b); return Math.min(d,24-d); };
    const ds = circDist(frac, displayStart);
    const de = circDist(frac, displayEnd);
    if (ds <= de) {
      // start handle chosen (no hard clamp yet)
      setDrag('s');
      tempStartRef.current = frac;
      tempEndRef.current = displayEnd;
      setTempStart(frac);
      setTempEnd(displayEnd);
      lastBuzzRef.current = Math.floor(frac);
    } else {
      // end handle chosen
      setDrag('e');
      tempEndRef.current = frac;
      tempStartRef.current = displayStart;
      setTempEnd(frac);
      setTempStart(displayStart);
      lastBuzzRef.current = Math.floor(frac);
    }
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  };

  // Compute eating segment styles (fractional). span may cross midnight.
  const span = spanHours(displayStart, displayEnd);
  const segs: Array<{left:number;width:number}> = [];
  if (span === 0) {
    // treat as full-day? Keep empty to show nothing; user can adjust.
  } else if ( (displayEnd - displayStart + 24) % 24 >= 0 && displayEnd >= displayStart) {
    segs.push({ left: displayStart, width: span });
  } else { // crosses midnight
    segs.push({ left: displayStart, width: (24 - displayStart) });
    segs.push({ left: 0, width: displayEnd });
  }

  const formatHourLabel = (val:number, alwaysMinutes:boolean) => {
    const h = Math.floor(val) % 24;
    const minutes = Math.round((val - Math.floor(val))*60);
    if(!alwaysMinutes && minutes===0) return h;
    const mm = (minutes===60?0:minutes).toString().padStart(2,'0');
    return `${h}:${mm}`;
  };


  // Apply dynamic positions without inline style attributes (lint rule forbids inline styles)
  useEffect(()=>{
    if(!trackRef.current) return;
    const els = trackRef.current.querySelectorAll('.fast-eating');
    segs.forEach((s,i)=>{
      const el = els[i] as HTMLElement|undefined; if(!el) return;
      el.style.left = `${(s.left/24)*100}%`;
      el.style.width = `${(s.width/24)*100}%`;
    });
    const startEl = trackRef.current.querySelector('.fast-h.start') as HTMLElement|null;
    const endEl = trackRef.current.querySelector('.fast-h.end') as HTMLElement|null;
    if(startEl) startEl.style.left = `${(displayStart/24)*100}%`;
    if(endEl) endEl.style.left = `${(displayEnd/24)*100}%`;
  },[displayStart,displayEnd,segs]);

  return (
    <div className="fast-line-wrap" data-fast-range>
      <div
        ref={trackRef}
        className={`fast-line thin ${valid? '' : 'invalid'}`}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onPointerMoveLocal}
        // no onPointerUp here; handled globally for smoother drag
      >
  {segs.map((_,i)=> (<div key={i} className="fast-eating" />))}
        <button
          type="button"
          aria-label="Начало"
          className={`fast-h start ${drag==='s'?'drag':''}`}
          onPointerDown={beginDrag('s')}
          onPointerMove={onPointerMoveLocal}
          onKeyDown={key('s')}
  ><span>{formatHourLabel(displayStart,true)}</span></button>
        <button
          type="button"
          aria-label="Конец"
          className={`fast-h end ${drag==='e'?'drag':''}`}
          onPointerDown={beginDrag('e')}
          onPointerMove={onPointerMoveLocal}
          onKeyDown={key('e')}
  ><span>{formatHourLabel(displayEnd,true)}</span></button>
      </div>
    </div>
  );
};

export default FastingRange;
