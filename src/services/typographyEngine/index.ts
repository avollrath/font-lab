import type { TypographyRule } from '../../types';

const STYLESHEET_ID = 'font-lab-styles';

export function escapeCSSSelectorValue(value: string): string {
  return value.replace(/[<>"'\\]/g, '');
}

export function generateRuleCSS(rule: TypographyRule, globallyEnabled: boolean): string {
  if (!rule.enabled || !globallyEnabled) return '';

  const declarations: string[] = [];

  if (rule.fontFamily?.enabled && rule.fontFamily.value) {
    const family = escapeCSSSelectorValue(rule.fontFamily.value);
    declarations.push(`  font-family: "${family}", Arial, sans-serif !important`);
  }

  if (rule.fontSize?.enabled && rule.fontSize.value) {
    const { value, unit } = rule.fontSize.value;
    if (value > 0) {
      declarations.push(`  font-size: ${value}${unit} !important`);
    }
  }

  if (rule.fontWeight?.enabled && rule.fontWeight.value) {
    declarations.push(`  font-weight: ${rule.fontWeight.value} !important`);
  }

  if (rule.lineHeight?.enabled && rule.lineHeight.value) {
    declarations.push(`  line-height: ${rule.lineHeight.value} !important`);
  }

  if (rule.letterSpacing?.enabled && rule.letterSpacing.value !== undefined) {
    declarations.push(`  letter-spacing: ${rule.letterSpacing.value} !important`);
  }

  if (rule.fontStyle?.enabled && rule.fontStyle.value) {
    declarations.push(`  font-style: ${rule.fontStyle.value} !important`);
  }

  if (rule.textTransform?.enabled && rule.textTransform.value) {
    declarations.push(`  text-transform: ${rule.textTransform.value} !important`);
  }

  if (declarations.length === 0) return '';

  return `${rule.selector} {\n${declarations.join(';\n')};\n}\n`;
}

export function generateFullCSS(rules: TypographyRule[], globallyEnabled: boolean): string {
  if (!globallyEnabled) return '';
  return rules
    .filter(r => r.enabled)
    .map(r => generateRuleCSS(r, globallyEnabled))
    .filter(Boolean)
    .join('\n');
}

export function getOrCreateStylesheet(doc: Document): HTMLStyleElement {
  let style = doc.getElementById(STYLESHEET_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = STYLESHEET_ID;
    style.setAttribute('data-font-lab', 'true');
    doc.head.appendChild(style);
  }
  return style;
}

export function updateStylesheet(rules: TypographyRule[], globallyEnabled: boolean, doc: Document = document): void {
  const style = getOrCreateStylesheet(doc);
  const css = generateFullCSS(rules, globallyEnabled);
  style.textContent = css;
}

export function removeStylesheet(doc: Document = document): void {
  const style = doc.getElementById(STYLESHEET_ID);
  if (style) style.remove();
}
