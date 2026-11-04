export function generateSelector(element: Element): string {
  if (element.id && /^[a-zA-Z][\w-]*$/.test(element.id)) {
    const selector = `#${CSS.escape(element.id)}`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  const tag = element.tagName.toLowerCase();

  const stableClasses = Array.from(element.classList)
    .filter(cls => !cls.match(/^(js-|is-|has-|active|hover|focus|disabled|selected)/))
    .filter(cls => !cls.match(/^\d/))
    .filter(cls => cls.length > 1)
    .slice(0, 3);

  if (stableClasses.length > 0) {
    const classSelector = `${tag}.${stableClasses.map(c => CSS.escape(c)).join('.')}`;
    try {
      if (document.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
      const firstClass = stableClasses[0];
      if (firstClass) {
        const simpleSelector = `${tag}.${CSS.escape(firstClass)}`;
        if (document.querySelectorAll(simpleSelector).length === 1) {
          return simpleSelector;
        }
      }
    } catch {
      // Invalid selector, continue
    }
  }

  const role = element.getAttribute('role');
  if (role) {
    const attrSelector = `${tag}[role="${role}"]`;
    if (document.querySelectorAll(attrSelector).length === 1) {
      return attrSelector;
    }
  }

  const parent = element.parentElement;
  if (parent) {
    const parentTag = parent.tagName.toLowerCase();
    if (parent.id && /^[a-zA-Z][\w-]*$/.test(parent.id)) {
      const sel = `#${CSS.escape(parent.id)} > ${tag}`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }
    const parentClasses = Array.from(parent.classList).filter(cls => cls.length > 1);
    const parentClass = parentClasses[0];
    if (parentClass) {
      const sel = `${parentTag}.${CSS.escape(parentClass)} > ${tag}`;
      try {
        if (document.querySelectorAll(sel).length === 1) return sel;
      } catch { /* continue */ }
    }

    const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName);
    const index = siblings.indexOf(element) + 1;
    if (index > 0) {
      return `${parentTag} > ${tag}:nth-of-type(${index})`;
    }
  }

  return tag;
}

export function validateSelector(selector: string): boolean {
  if (!selector || selector.trim().length === 0) return false;
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}
