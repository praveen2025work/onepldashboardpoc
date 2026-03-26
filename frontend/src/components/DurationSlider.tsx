import React, { useRef, useCallback, useState, useEffect } from 'react';
import { T } from '../styles/tokens';

interface Props {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  slaThreshold?: number;
}

export default function DurationSlider({
  min, max, valueMin, valueMax, onChange, slaThreshold = 5,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocalMin(valueMin); }, [valueMin]);
  useEffect(() => { setLocalMax(valueMax); }, [valueMax]);

  const commitChange = useCallback((newMin: number, newMax: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(newMin, newMax), 300);
  }, [onChange]);

  const pctOf = (v: number) => ((v - min) / (max - min)) * 100;
  const slaPct = pctOf(slaThreshold);

  const startDrag = useCallback((thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;

    const onMove = (ev: MouseEvent) => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const val = Math.round((min + pct * (max - min)) * 10) / 10;

      if (thumb === 'min') {
        const clamped = Math.min(val, localMax - 0.1);
        setLocalMin(Math.max(min, clamped));
        commitChange(Math.max(min, clamped), localMax);
      } else {
        const clamped = Math.max(val, localMin + 0.1);
        setLocalMax(Math.min(max, clamped));
        commitChange(localMin, Math.min(max, clamped));
      }
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [min, max, localMin, localMax, commitChange]);

  const isFiltered = localMin > min || localMax < max;
  const showingBreach = localMin >= slaThreshold;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Label */}
      <span style={{
        fontSize: 10, fontWeight: 700, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }}>Duration</span>

      {/* Min value */}
      <span style={{
        fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, minWidth: 32, textAlign: 'right',
        color: localMin >= slaThreshold ? T.danger : T.textPrimary,
      }}>{localMin}h</span>

      {/* Track */}
      <div
        ref={trackRef}
        style={{
          position: 'relative', width: 180, height: 24,
          display: 'flex', alignItems: 'center', cursor: 'pointer',
        }}
      >
        {/* Background track */}
        <div style={{
          position: 'absolute', top: 9, left: 0, right: 0, height: 6,
          borderRadius: 3, background: T.bg, border: `1px solid ${T.cardBorder}`,
        }} />

        {/* SLA threshold marker */}
        <div style={{
          position: 'absolute', top: 4, left: `${slaPct}%`, width: 1, height: 16,
          background: T.danger, opacity: 0.4,
        }} />
        <span style={{
          position: 'absolute', top: -8, left: `${slaPct}%`, transform: 'translateX(-50%)',
          fontSize: 7, fontWeight: 700, color: T.danger, opacity: 0.6,
        }}>SLA</span>

        {/* Active range fill */}
        <div style={{
          position: 'absolute', top: 9, height: 6, borderRadius: 3,
          left: `${pctOf(localMin)}%`,
          width: `${pctOf(localMax) - pctOf(localMin)}%`,
          background: showingBreach
            ? `linear-gradient(90deg, ${T.danger}60, ${T.danger}90)`
            : `linear-gradient(90deg, ${T.accent}40, ${T.accent}70)`,
        }} />

        {/* Min thumb */}
        <div
          onMouseDown={startDrag('min')}
          style={{
            position: 'absolute', top: 4, left: `${pctOf(localMin)}%`, transform: 'translateX(-50%)',
            width: 16, height: 16, borderRadius: '50%',
            background: T.surface, border: `2px solid ${localMin >= slaThreshold ? T.danger : T.accent}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', cursor: 'grab', zIndex: 2,
          }}
        />

        {/* Max thumb */}
        <div
          onMouseDown={startDrag('max')}
          style={{
            position: 'absolute', top: 4, left: `${pctOf(localMax)}%`, transform: 'translateX(-50%)',
            width: 16, height: 16, borderRadius: '50%',
            background: T.surface, border: `2px solid ${localMax > slaThreshold ? T.danger : T.accent}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', cursor: 'grab', zIndex: 2,
          }}
        />
      </div>

      {/* Max value */}
      <span style={{
        fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, minWidth: 32,
        color: localMax > slaThreshold ? T.danger : T.textPrimary,
      }}>{localMax}h</span>

      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
        <button
          onClick={() => { setLocalMin(slaThreshold); setLocalMax(max); onChange(slaThreshold, max); }}
          style={{
            padding: '3px 8px', borderRadius: 12, border: `1px solid ${T.danger}40`,
            background: showingBreach ? T.dangerLight : 'transparent',
            color: T.danger, fontFamily: T.font, fontSize: 9, fontWeight: 700, cursor: 'pointer',
          }}
        >Breach &gt;{slaThreshold}h</button>
        {isFiltered && (
          <button
            onClick={() => { setLocalMin(min); setLocalMax(max); onChange(min, max); }}
            style={{
              padding: '3px 8px', borderRadius: 12, border: `1px solid ${T.cardBorder}`,
              background: T.surface, color: T.textSecondary,
              fontFamily: T.font, fontSize: 9, fontWeight: 700, cursor: 'pointer',
            }}
          >Reset</button>
        )}
      </div>
    </div>
  );
}
