import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove Arabic diacritics/harakat and tatwil
    .replace(/[\u064b-\u065f\u0670\u0674\u0656-\u065f\u0640]/g, '')
    // Normalize Arabic letter variations for fault-tolerant search
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'and', 'or', 'for', 'by', 'with', 'is', 'it',
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'en', 'a', 'au', 'aux',
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'و', 'أو', 'ال'
]);

export function getSearchRelevance(query: string, title: string, author: string): number {
  if (!query || !query.trim()) return 1;
  const q = normalizeText(query);
  const t = normalizeText(title || '');
  const a = normalizeText(author || '');

  if (!q) return 1;

  let score = 0;

  // 1. Exact Match
  if (t === q) score += 3000;
  else if (a === q) score += 2000;
  
  // 2. Starts with query
  if (t.startsWith(q + ' ')) score += 1500;
  else if (t.startsWith(q)) score += 1200;

  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/).filter(Boolean);
  const aWords = a.split(/\s+/).filter(Boolean);

  if (qWords.length === 0) return score > 0 ? score : 0;

  const significantQWords = qWords.filter(w => !STOP_WORDS.has(w));
  const effectiveTargetWords = significantQWords.length > 0 ? significantQWords : qWords;
  
  let matchedWords = 0;

  for (const qw of effectiveTargetWords) {
    let found = false;
    let exact = false;
    let prefix = false;

    // Check title words
    for (const tw of tWords) {
      if (tw === qw) {
        found = true;
        exact = true;
        break;
      }
      if (tw.startsWith(qw)) {
        found = true;
        prefix = true;
        break;
      }
      if (qw.length > 2 && tw.includes(qw)) {
        found = true;
        break;
      }
      if (qw.length >= 3 && tw.length >= 3) {
        const dist = levenshteinDistance(qw, tw);
        const maxDist = qw.length <= 5 ? 1 : 2;
        if (dist <= maxDist) {
          found = true;
          break;
        }
      }
    }

    // Check author words if not found in title
    if (!found) {
      for (const aw of aWords) {
        if (aw === qw) {
          found = true;
          exact = true;
          break;
        }
        if (aw.startsWith(qw)) {
          found = true;
          prefix = true;
          break;
        }
        if (qw.length > 2 && aw.includes(qw)) {
          found = true;
          break;
        }
        if (qw.length >= 3 && aw.length >= 3) {
          const dist = levenshteinDistance(qw, aw);
          const maxDist = qw.length <= 5 ? 1 : 2;
          if (dist <= maxDist) {
            found = true;
            break;
          }
        }
      }
    }

    if (found) {
      matchedWords++;
      if (exact) {
        score += 200;
      } else if (prefix) {
        score += 100;
      } else {
        score += 50;
      }
    }
  }

  const minRequired = effectiveTargetWords.length === 1 ? 1 : Math.max(1, Math.floor(effectiveTargetWords.length * 0.5));

  if (matchedWords >= minRequired) {
    if (matchedWords === effectiveTargetWords.length) {
      score += 500;
    }
    
    if (t.includes(q)) {
      if (new RegExp(`\\b${q}\\b`).test(t)) {
        score += 800;
      } else {
        score += 300;
      }
    }

    return score + (matchedWords * 10);
  }

  return score > 0 ? score : 0;
}

export function fuzzyMatch(pattern: string, text: string): boolean {
  return getSearchRelevance(pattern, text, '') > 0;
}

export function searchBooks<T extends { title?: string; author?: string; created_at?: string }>(books: T[], query: string, limit?: number): T[] {
  if (!query || !query.trim()) return limit ? books.slice(0, limit) : books;
  
  const scored = books
    .map(book => ({
      book,
      score: getSearchRelevance(query, book.title || '', book.author || '')
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Secondary sort: title length (shorter titles matching query are usually better matches)
      const aTitleLen = a.book.title?.length || 0;
      const bTitleLen = b.book.title?.length || 0;
      if (aTitleLen !== bTitleLen) return aTitleLen - bTitleLen;
      // Tertiary sort: newer books first
      if (a.book.created_at && b.book.created_at) {
        return new Date(b.book.created_at).getTime() - new Date(a.book.created_at).getTime();
      }
      return 0;
    });

  const results = scored.map(item => item.book);
  return limit ? results.slice(0, limit) : results;
}

export function formatOrderRef(order: any, fallbackId?: string): string {
  if (!order) return fallbackId ? (fallbackId.toLowerCase().startsWith('yal-') ? fallbackId : 'yal-' + fallbackId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()) : 'yal-PENDING';
  
  if (typeof order === 'string') {
    if (order.toLowerCase().startsWith('yal-')) return order;
    if (fallbackId && fallbackId.toLowerCase().startsWith('yal-')) return fallbackId;
    return 'yal-' + order.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
  }
  
  if (order.client_note) {
    const match = order.client_note.match(/TRACKING:([^\s|]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  if (order.id && order.id.toLowerCase().startsWith('yal-')) {
    return order.id;
  }
  
  const rawId = order.id || fallbackId || 'UNKNOWN';
  return 'yal-' + rawId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
}

