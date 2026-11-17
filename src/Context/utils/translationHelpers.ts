import { TH_TRANSLATIONS, TOKEN_TRANSLATIONS } from '../translationsData';
import { TRANSLATIONS } from '../translations/masterTranslations';
import { QUICK_MAP } from '../translations/quickMapTranslations';

// Global direct string translation helper
export const getUrduText = (str: string): string => {
  if (!str) return str;

  // Extract and preserve sort arrows: ↑, ↓, ▲, ▼, ⇅, ↕
  const arrowMatch = str.match(/[↑↓▲▼⇅↕]+/);
  const arrow = arrowMatch ? arrowMatch[0] : '';
  const cleanNoArrow = str.replace(/[↑↓▲▼⇅↕]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const clean = str.replace(/\s+/g, ' ').trim().toLowerCase();

  // Pattern: Page X of Y -> صفحہ X از Y
  const pageMatch = clean.match(/^page\s+(\d+)\s+of\s+(\d+)$/i);
  if (pageMatch) {
    return `صفحہ ${pageMatch[1]} از ${pageMatch[2]}`;
  }

  // Pattern: X Available -> X دستیاب
  const availMatch = clean.match(/^(\d+)\s+available$/i);
  if (availMatch) {
    return `${availMatch[1]} دستیاب`;
  }

  // Preserve leading emojis e.g. 🧾
  const emojiMatch = str.match(/^([^\w\s\u0600-\u06FF]+)\s*/);
  const emojiPrefix = emojiMatch ? `${emojiMatch[1]} ` : '';
  const cleanNoEmoji = emojiPrefix ? clean.substring(emojiMatch[0].length).trim() : clean;

  // Direct key lookup
  for (const [key, val] of Object.entries(TRANSLATIONS)) {
    if (key.toLowerCase() === clean || val.en.toLowerCase() === clean) {
      return val.ur;
    }
  }

  if (QUICK_MAP[clean]) return QUICK_MAP[clean];
  if (emojiPrefix && QUICK_MAP[cleanNoEmoji]) return `${emojiPrefix}${QUICK_MAP[cleanNoEmoji]}`;
  if (arrow && QUICK_MAP[cleanNoArrow]) return `${QUICK_MAP[cleanNoArrow]} ${arrow}`;

  // Check 580+ TH master translations directly
  if (TH_TRANSLATIONS[clean]) return TH_TRANSLATIONS[clean];
  if (emojiPrefix && TH_TRANSLATIONS[cleanNoEmoji]) return `${emojiPrefix}${TH_TRANSLATIONS[cleanNoEmoji]}`;
  if (arrow && TH_TRANSLATIONS[cleanNoArrow]) return `${TH_TRANSLATIONS[cleanNoArrow]} ${arrow}`;

  // Strip currency tags e.g. (PKR) or (Rs.)
  const cleanNoPkr = clean.replace(/\s*\(pkr\)/g, '').replace(/\s*\(rs\.\)/g, '').trim();
  if (TH_TRANSLATIONS[cleanNoPkr]) {
    const suffix = clean.includes('(pkr)') || clean.includes('(rs.)') ? ' (روپے)' : '';
    return `${TH_TRANSLATIONS[cleanNoPkr]}${suffix}`;
  }

  // Strip leading/trailing dots, hashes, colons, pluses, sort arrows, ellipsis
  const stripped = clean
    .replace(/^[.\s#+:–—\->←⇅▲▼↑↓/]+/, '')
    .replace(/[.\s#+:–—\->←⇅▲▼↑↓/]+$/, '')
    .trim();

  if (QUICK_MAP[stripped]) {
    if (clean.startsWith('#')) return `${QUICK_MAP[stripped]} #`;
    if (clean.startsWith('+') || clean.endsWith('+')) return `+ ${QUICK_MAP[stripped]}`;
    return QUICK_MAP[stripped];
  }

  if (TH_TRANSLATIONS[stripped]) {
    if (clean.startsWith('#')) return `${TH_TRANSLATIONS[stripped]} #`;
    if (clean.startsWith('+') || clean.endsWith('+')) return `+ ${TH_TRANSLATIONS[stripped]}`;
    return TH_TRANSLATIONS[stripped];
  }

  // Multi-word Token Fallback (ONLY for short compound headers <= 3 words where ALL words are recognized)
  const words = clean.split(/[\s/]+/);
  if (words.length > 1 && words.length <= 3) {
    const allWordsRecognized = words.every((w) => {
      const wClean = w.replace(/^[.\s#+:–—\->←⇅▲▼↑↓()]+/, '').replace(/[.\s#+:–—\->←⇅▲▼↑↓()]+$/, '').toLowerCase();
      return !!(TOKEN_TRANSLATIONS[wClean] || TH_TRANSLATIONS[wClean] || QUICK_MAP[wClean]);
    });

    if (allWordsRecognized) {
      const translatedWords = words.map((w) => {
        const wClean = w.replace(/^[.\s#+:–—\->←⇅▲▼↑↓()]+/, '').replace(/[.\s#+:–—\->←⇅▲▼↑↓()]+$/, '').toLowerCase();
        return TOKEN_TRANSLATIONS[wClean] || TH_TRANSLATIONS[wClean] || QUICK_MAP[wClean] || w;
      });
      return translatedWords.join(' ');
    }
  }

  return str;
};
