import React, { useState, useRef, useCallback } from 'react';
import { T } from '../styles/tokens';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
}

export default function ResizableSplit({
  left, right,
  defaultLeftPercent = 35,
  minLeftPercent = 20,
  maxLeftPercent = 65,
}: Props) {
  const [leftPct, setLeftPct] = useState(defaultLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(minLeftPercent, Math.min(maxLeftPercent, pct)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [minLeftPercent, maxLeftPercent]);

  return (
    <div ref={containerRef} style={{ display: 'flex', gap: 0, width: '100%' }}>
      <div style={{ width: `${leftPct}%`, flexShrink: 0 }}>
        {left}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 12, flexShrink: 0, cursor: 'col-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
        }}
      >
        <div style={{
          width: 4, height: 32, borderRadius: 2,
          background: T.cardBorder, transition: 'background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.accent; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.cardBorder; }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {right}
      </div>
    </div>
  );
}
