let scratch: HTMLTextAreaElement | null = null;

/**
 * OMDb's data (scraped from IMDb) sometimes contains literal HTML entities
 * (e.g. "D&apos;Arcy") instead of the actual character. Decoding through a
 * detached textarea is safe here since `.value` never re-parses as markup.
 */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  if (!scratch) scratch = document.createElement('textarea');
  scratch.innerHTML = text;
  return scratch.value;
}
