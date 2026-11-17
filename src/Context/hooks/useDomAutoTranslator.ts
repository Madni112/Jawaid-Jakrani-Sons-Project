import { useEffect } from 'react';
import { Language } from '../translations/types';
import { getUrduText } from '../utils/translationHelpers';
import { TH_TRANSLATIONS } from '../translationsData';
import { QUICK_MAP } from '../translations/quickMapTranslations';

export const useDomAutoTranslator = (language: Language) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const translateElements = () => {
      if (language !== 'ur') return;

      const isBusinessData = (text: string) => {
        if (!text) return true;
        // Pure numbers, currencies, phone numbers, codes, dates
        if (/^[\d,.\-+/()#\s:]+$/.test(text) && !/[a-zA-Z]/.test(text)) return true;
        if (/^Rs\.?\s*[\d,.]+/i.test(text)) return true;
        if (/^\+?92[\d\s-]+/.test(text)) return true;
        return false;
      };

      // 1. Table Headers (th) - translates text nodes while preserving sort arrows, svgs, and buttons!
      const thElements = document.querySelectorAll('th');
      thElements.forEach((th) => {
        if (th.querySelector('input[type="checkbox"], select')) return;

        const walker = document.createTreeWalker(th, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || /^[⇅▲▼↑↓\s]+$/.test(raw)) continue;

          const urdu = getUrduText(raw);
          if (urdu && urdu !== raw) {
            const parent = (node.parentElement as HTMLElement) || th;
            if (!parent.getAttribute('data-en-text')) {
              parent.setAttribute('data-en-text', raw);
            }
            if (node.textContent?.trim() !== urdu) {
              node.textContent = node.textContent?.replace(raw, urdu) || urdu;
            }
          }
        }
      });

      // 2. Table Footers (tfoot td / tfoot th)
      const tfElements = document.querySelectorAll('tfoot td, tfoot th');
      tfElements.forEach((tf) => {
        const walker = document.createTreeWalker(tf, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || isBusinessData(raw)) continue;

          const urdu = getUrduText(raw);
          if (urdu && urdu !== raw) {
            const parent = (node.parentElement as HTMLElement) || (tf as HTMLElement);
            if (!parent.getAttribute('data-en-text')) {
              parent.setAttribute('data-en-text', raw);
            }
            if (node.textContent?.trim() !== urdu) {
              node.textContent = node.textContent?.replace(raw, urdu) || urdu;
            }
          }
        }
      });

      // 3. Action Buttons & Button Links
      const buttons = document.querySelectorAll('button, a.btn, a[role="button"]');
      buttons.forEach((btn) => {
        const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || isBusinessData(raw)) continue;

          const urdu = getUrduText(raw);
          if (urdu && urdu !== raw) {
            const parent = (node.parentElement as HTMLElement) || (btn as HTMLElement);
            if (!parent.getAttribute('data-en-text')) {
              parent.setAttribute('data-en-text', raw);
            }
            if (node.textContent?.trim() !== urdu) {
              node.textContent = node.textContent?.replace(raw, urdu) || urdu;
            }
          }
        }
      });

      // 4. Page Titles, Section Headings & Card Titles (h1 to h6)
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((h) => {
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || isBusinessData(raw)) continue;

          const urdu = getUrduText(raw);
          if (urdu && urdu !== raw) {
            const parent = (node.parentElement as HTMLElement) || h;
            if (!parent.getAttribute('data-en-text')) {
              parent.setAttribute('data-en-text', raw);
            }
            if (node.textContent?.trim() !== urdu) {
              node.textContent = node.textContent?.replace(raw, urdu) || urdu;
            }
          }
        }
      });

      // 5. Descriptive Subtitles (p) - Safe TreeWalker
      const descParas = document.querySelectorAll('p.text-xs, p.text-sm, p.text-gray-400, p.text-slate-400, p.text-gray-500');
      descParas.forEach((p) => {
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || isBusinessData(raw)) continue;

          const urdu = getUrduText(raw);
          if (urdu && urdu !== raw) {
            const parent = (node.parentElement as HTMLElement) || p;
            if (!parent.getAttribute('data-en-text')) {
              parent.setAttribute('data-en-text', raw);
            }
            if (node.textContent?.trim() !== urdu) {
              node.textContent = node.textContent?.replace(raw, urdu) || urdu;
            }
          }
        }
      });

      // 6. UI Badges, Filter Controls & Status Spans (NEVER touches td business data) - Safe TreeWalker
      const spans = document.querySelectorAll('span');
      spans.forEach((sp) => {
        if (sp.closest('td:not([colspan])') || sp.classList.contains('font-mono') || sp.hasAttribute('data-no-translate')) return;

        const walker = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || isBusinessData(raw)) continue;

          const lower = raw.toLowerCase();
          if (
            lower === 'show' || lower === 'entries' || lower === 'search:' || lower === ':search' ||
            lower === 'active' || lower === 'inactive' || lower === 'paid' || lower === 'unpaid' ||
            lower === 'partially paid' || lower === 'pending' || lower === 'completed' || lower === 'draft' ||
            lower === 'on credit' || lower === 'cash' || lower === 'previous' || lower === 'next' ||
            TH_TRANSLATIONS[lower] || QUICK_MAP[lower]
          ) {
            const urdu = getUrduText(raw);
            if (urdu && urdu !== raw) {
              const parent = (node.parentElement as HTMLElement) || sp;
              if (!parent.getAttribute('data-en-text')) {
                parent.setAttribute('data-en-text', raw);
              }
              if (node.textContent?.trim() !== urdu) {
                node.textContent = node.textContent?.replace(raw, urdu) || urdu;
              }
            }
          }
        }
      });

      // 7. Select Dropdown Placeholder Options
      const options = document.querySelectorAll('select option');
      options.forEach((opt) => {
        const raw = opt.textContent?.trim();
        if (!raw || isBusinessData(raw)) return;

        const urdu = getUrduText(raw);
        if (urdu && urdu !== raw) {
          if (!opt.getAttribute('data-en-text')) {
            opt.setAttribute('data-en-text', raw);
          }
          if (opt.textContent?.trim() !== urdu) {
            opt.textContent = urdu;
          }
        }
      });

      // 8. Empty Table Notices (td with colSpan or italic or empty-state) - Safe TreeWalker
      const emptyTds = document.querySelectorAll('td[colspan], td.italic, .empty-state');
      emptyTds.forEach((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw || isBusinessData(raw)) continue;
          const clean = raw.replace(/^[.\s]+/, '').replace(/[.\s]+$/, '');
          const urdu = getUrduText(raw) || getUrduText(clean);
          if (urdu && urdu !== raw) {
            const parent = (node.parentElement as HTMLElement) || (el as HTMLElement);
            if (!parent.getAttribute('data-en-text')) {
              parent.setAttribute('data-en-text', raw);
            }
            if (node.textContent?.trim() !== urdu) {
              node.textContent = node.textContent?.replace(raw, urdu) || urdu;
            }
          }
        }
      });

      // 9. Search Input Placeholders
      const inputs = document.querySelectorAll('input[type="text"], input[type="search"]');
      inputs.forEach((input) => {
        const ph = (input as HTMLInputElement).placeholder?.trim();
        if (!ph) return;
        const cleanPh = ph.replace(/^[.\s]+/, '').replace(/[.\s]+$/, '');
        const urdu = getUrduText(ph) || getUrduText(cleanPh);
        if (urdu && urdu !== ph) {
          if (!input.getAttribute('data-en-placeholder')) {
            input.setAttribute('data-en-placeholder', ph);
          }
          if ((input as HTMLInputElement).placeholder !== urdu) {
            (input as HTMLInputElement).placeholder = urdu;
          }
        }
      });

      // 10. Universal Pagination Pattern Interceptor (Safe TreeWalker)
      const paginationNodes = document.querySelectorAll('div, span, p');
      paginationNodes.forEach((el) => {
        if (el.closest('table tbody, form, input, select')) return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const raw = node.textContent?.trim();
          if (!raw) continue;

          // Pattern: Showing X to Y of Z entries
          const showingMatch = raw.match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s*(?:stock\s*)?entries?/i);
          if (showingMatch) {
            const urdu = `کل ${showingMatch[3]} میں سے ${showingMatch[1]} تا ${showingMatch[2]} ریکارڈز`;
            if (node.textContent?.trim() !== urdu) {
              node.textContent = urdu;
            }
            continue;
          }

          // Pattern: Page X of Y
          const pageMatch = raw.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i);
          if (pageMatch) {
            const urdu = `صفحہ ${pageMatch[1]} از ${pageMatch[2]}`;
            if (node.textContent?.trim() !== urdu) {
              node.textContent = urdu;
            }
            continue;
          }
        }
      });
    };

    const restoreElements = () => {
      const translated = document.querySelectorAll('[data-en-text]');
      translated.forEach((el) => {
        const en = el.getAttribute('data-en-text');
        if (en) {
          el.textContent = en;
          el.removeAttribute('data-en-text');
        }
      });

      const translatedPlaceholders = document.querySelectorAll('[data-en-placeholder]');
      translatedPlaceholders.forEach((input) => {
        const en = input.getAttribute('data-en-placeholder');
        if (en) {
          (input as HTMLInputElement).placeholder = en;
          input.removeAttribute('data-en-placeholder');
        }
      });
    };

    if (language === 'ur') {
      translateElements();

      let frameId: number | null = null;
      const observer = new MutationObserver(() => {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          translateElements();
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false,
      });

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
        observer.disconnect();
      };
    } else {
      restoreElements();
    }
  }, [language]);
};
