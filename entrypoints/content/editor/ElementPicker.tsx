import { useState, useEffect, useRef } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { generateSelector } from '../../../src/services/selectorGenerator';
import type { TypographyRule } from '../../../src/types';

interface Props {
  onSelect: (selector: string) => void;
  onCancel: () => void;
}

export function ElementPicker({ onSelect, onCancel }: Props) {
  const { addCustomRule } = useTypographyStore();
  const [highlight, setHighlight] = useState<DOMRect | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.id === 'font-lab-root') return;
      targetRef.current = el;
      const rect = el.getBoundingClientRect();
      setHighlight(rect);
      const selector = generateSelector(el);
      setTooltip({ x: e.clientX + 12, y: e.clientY + 12, text: selector });
    };

    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!targetRef.current) return;
      const selector = generateSelector(targetRef.current);
      const rule: TypographyRule = {
        id: `custom-${Date.now()}`,
        selector,
        label: selector,
        category: 'custom',
        enabled: true,
      };
      addCustomRule(rule);
      onSelect(selector);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);

    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [addCustomRule, onSelect, onCancel]);

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2147483640, cursor: 'crosshair',
          background: 'transparent', pointerEvents: 'all',
        }}
      />
      {highlight && (
        <div
          style={{
            position: 'fixed',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            border: '2px solid #3b6ef0',
            background: 'rgba(59,110,240,0.1)',
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: 2147483641,
          }}
        />
      )}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y,
            left: tooltip.x,
            background: '#1a202c',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 2147483642,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}
