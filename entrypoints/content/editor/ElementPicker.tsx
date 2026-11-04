import { useEffect, useRef } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';
import { generateSelector } from '../../../src/services/selectorGenerator';
import type { TypographyRule } from '../../../src/types';

interface Props {
  onSelect: (selector: string) => void;
  onCancel: () => void;
}

export function ElementPicker({ onSelect, onCancel }: Props) {
  const { addCustomRule } = useTypographyStore();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    // Inject overlay elements into the real document (outside Shadow DOM)
    // so they can cover the entire page and intercept events
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483640;
      cursor: crosshair; background: transparent;
    `;
    overlayRef.current = overlay;

    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: fixed; z-index: 2147483641; pointer-events: none;
      border: 2px solid #3b6ef0; background: rgba(59,110,240,0.1);
      border-radius: 2px; display: none;
    `;
    highlightRef.current = highlight;

    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed; z-index: 2147483642; pointer-events: none;
      background: #1a202c; color: white; padding: 4px 8px;
      border-radius: 4px; font-size: 11px; font-family: monospace;
      white-space: nowrap; display: none;
    `;
    tooltipRef.current = tooltip;

    document.body.appendChild(overlay);
    document.body.appendChild(highlight);
    document.body.appendChild(tooltip);

    const onMove = (e: MouseEvent) => {
      // Find element under cursor, ignoring our injected elements
      overlay.style.display = 'none';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.display = '';

      if (!el || el === overlay || el.closest('#font-lab-root')) return;

      targetRef.current = el;
      const rect = el.getBoundingClientRect();

      highlight.style.display = '';
      highlight.style.top = `${rect.top}px`;
      highlight.style.left = `${rect.left}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      const sel = generateSelector(el);
      tooltip.style.display = '';
      tooltip.style.top = `${Math.min(e.clientY + 12, window.innerHeight - 40)}px`;
      tooltip.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 200)}px`;
      tooltip.textContent = sel;
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

    overlay.addEventListener('mousemove', onMove);
    overlay.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey, true);

    return () => {
      overlay.removeEventListener('mousemove', onMove);
      overlay.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      highlight.remove();
      tooltip.remove();
    };
  }, [addCustomRule, onSelect, onCancel]);

  // This component renders nothing into the Shadow DOM;
  // all DOM manipulation is done via imperative DOM in useEffect
  return null;
}
