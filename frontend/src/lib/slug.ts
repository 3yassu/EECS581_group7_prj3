// changes recipe name to id string
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD') // split "é" into "e" + a combining accent mark
    .replace(/[\u0300-\u036f]/g, '') // drop the accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // anything that isn't a letter/digit becomes "-"
    .replace(/^-+|-+$/g, '') // no leading/trailing "-"
  return slug || 'recipe' // titles with no a-z0-9 at all (e.g. emoji only)
}
 
// Like slugify, but adds -2, -3, ... if that slug is already taken.
export function uniqueSlug(title: string, taken: string[]): string {
  const base = slugify(title)
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}
 
