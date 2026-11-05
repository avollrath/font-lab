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
    } catch {
      const ta = document.createElement('textarea');
      ta.value = css;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fontpickle-styles.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fp-export">
      <label className="fp-export-option">
        <input
          type="checkbox"
          checked={includeImportant}
          onChange={e => setIncludeImportant(e.target.checked)}
        />
        Include <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>!important</code>
      </label>

      {activeRules.length === 0 ? (
        <div className="fp-empty-state">
          <div className="fp-empty-state-icon">⌗</div>
          <div>No active rules to export.</div>
          <div style={{ fontSize: '11px' }}>Enable some elements and set their fonts first.</div>
        </div>
      ) : (
        <>
          <pre className="fp-code-preview">{css}</pre>
          <div className="fp-export-actions">
            <button className="fp-btn fp-btn--primary fp-btn--sm" onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy CSS'}
            </button>
            <button className="fp-btn fp-btn--sm" onClick={handleDownload}>
              Download .css
            </button>
          </div>
        </>
      )}
    </div>
  );
}
