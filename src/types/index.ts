export interface TypographyPropertyValue<T> {
  enabled: boolean;
  value: T;
}

export interface FontSizeValue {
  value: number;
  unit: 'px' | 'rem' | 'em';
}

export interface TypographyRule {
  id: string;
  selector: string;
  label: string;
  category: 'headings' | 'body' | 'interactive' | 'global' | 'custom';
  enabled: boolean;
  fontFamily?: TypographyPropertyValue<string>;
  fontSize?: TypographyPropertyValue<FontSizeValue>;
  fontWeight?: TypographyPropertyValue<number>;
  lineHeight?: TypographyPropertyValue<string>;
  letterSpacing?: TypographyPropertyValue<string>;
  fontStyle?: TypographyPropertyValue<'normal' | 'italic'>;
  textTransform?: TypographyPropertyValue<'none' | 'uppercase' | 'lowercase' | 'capitalize'>;
}

export interface SiteConfiguration {
  version: number;
  origin: string;
  enabled: boolean;
  rules: TypographyRule[];
  panelPosition?: { x: number; y: number };
}

export interface Preset {
  id: string;
  name: string;
  isBuiltIn: boolean;
  rules: TypographyRule[];
  createdAt: number;
}

export interface FontCatalogEntry {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
}

export const DEFAULT_RULES: TypographyRule[] = [
  { id: 'h1', selector: 'h1', label: 'Heading 1', category: 'headings', enabled: false },
  { id: 'h2', selector: 'h2', label: 'Heading 2', category: 'headings', enabled: false },
  { id: 'h3', selector: 'h3', label: 'Heading 3', category: 'headings', enabled: false },
  { id: 'h4', selector: 'h4', label: 'Heading 4', category: 'headings', enabled: false },
  { id: 'h5', selector: 'h5', label: 'Heading 5', category: 'headings', enabled: false },
  { id: 'h6', selector: 'h6', label: 'Heading 6', category: 'headings', enabled: false },
  { id: 'p', selector: 'p', label: 'Paragraph', category: 'body', enabled: false },
  { id: 'li', selector: 'li', label: 'List Item', category: 'body', enabled: false },
  { id: 'blockquote', selector: 'blockquote', label: 'Blockquote', category: 'body', enabled: false },
  { id: 'small', selector: 'small', label: 'Small Text', category: 'body', enabled: false },
  { id: 'a', selector: 'a', label: 'Link', category: 'interactive', enabled: false },
  { id: 'button', selector: 'button', label: 'Button', category: 'interactive', enabled: false },
  { id: 'input', selector: 'input', label: 'Input', category: 'interactive', enabled: false },
  { id: 'textarea', selector: 'textarea', label: 'Textarea', category: 'interactive', enabled: false },
  { id: 'label', selector: 'label', label: 'Label', category: 'interactive', enabled: false },
  { id: 'body', selector: 'body', label: 'Body', category: 'global', enabled: false },
];
