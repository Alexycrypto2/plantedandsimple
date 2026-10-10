// Pure helpers that keep Pinterest copy aligned with a recipe's own SEO keywords.

export function primaryKeyword(seoTitle: string | null | undefined, title: string): string {
  const base = (seoTitle?.trim() || title).split(/\s[—|–-]\s|\s\|\s/)[0]?.trim() || title;
  return base.replace(/\s+/g, " ").slice(0, 80);
}

/** Make sure the pin description opens with the search phrase and ends with the recipe link. */
export function alignPinDescription(description: string, keyword: string, link: string | null): string {
  let text = description.trim();
  if (!text.slice(0, 80).toLowerCase().includes(keyword.toLowerCase())) {
    text = `${keyword}: ${text}`;
  }
  if (link && !text.includes(link)) text = `${text} ${link}`;
  return text.slice(0, 500);
}

/** Make sure the pin title contains the keyword, front-loaded. */
export function alignPinTitle(title: string, keyword: string): string {
  const t = title.trim();
  if (t.toLowerCase().includes(keyword.toLowerCase())) return t.slice(0, 100);
  return `${keyword} | ${t}`.slice(0, 100);
}
