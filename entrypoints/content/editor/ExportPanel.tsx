import { useState } from 'react';
import { useTypographyStore } from '../../../src/stores/typographyStore';

export function ExportPanel() {
  const { exportCurrentCSS, rules } = useTypographyStore();
  const [includeImportant, setIncludeImportant] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeRules = rules.filter(r => r.enabled);
  const css = exportCurrentCSS(includeImportant);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = css;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'font-lab-styles.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fl-export">
      <div className="fl-section-title">Export CSS</div>

      {activeRules.length === 0 ? (
        <div className="fl-empty">No active typography rules to export. Enable some rules first.</div>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--fl-text-muted)' }}>
            <input
              type="checkbox"
              checked={includeImportant}
              onChange={e => setIncludeImportant(e.target.checked)}
            />
            Include !important
          </label>

          <pre className="fl-export-code">{css}</pre>

          <div className="fl-export-actions">
            <button className="fl-btn fl-btn--primary" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy CSS'}
            </button>
            <button className="fl-btn" onClick={handleDownload}>Download .css</button>
          </div>
        </>
      )}
    </div>
  );
}
