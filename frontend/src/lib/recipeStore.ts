import { RECIPES } from '../types/recipe'
import type { Recipe, SavedRecipe } from '../types/recipe'

const STORAGE_KEY = 'cookbook:recipes:v1'

// changes recipe name to id string
function slugify(title: string): string {
  const slug = title
    .normalize('NFKD') // split "é" into "e" + a combining accent mark
    .replace(/[\u0300-\u036f]/g, '') // drop the accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // anything that isn't a letter/digit becomes "-"
    .replace(/^-+|-+$/g, '') // no leading/trailing "-"
  return slug || 'recipe' // titles with no a-z0-9 at all (e.g. emoji only)
}
 
// Like slugify, but adds -2, -3, ... if that slug is already taken.
function uniqueSlug(title: string, taken: string[]): string {
  const base = slugify(title)
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function isIngredient(x: unknown): boolean {
  return (
    isRecord(x) &&
    typeof x.quantity === 'string' &&
    typeof x.unit === 'string' &&
    typeof x.name === 'string'
  )
}

function isOptionalNumber(x: unknown): boolean {
  return x === undefined || typeof x === 'number'
}

function isSavedRecipe(x: unknown): x is SavedRecipe {
  return (
    isRecord(x) &&
    typeof x.slug === 'string' &&
    typeof x.title === 'string' &&
    typeof x.sourceUrl === 'string' &&
    isOptionalNumber(x.servings) &&
    isOptionalNumber(x.totalTimeMinutes) &&
    Array.isArray(x.ingredients) &&
    x.ingredients.every(isIngredient) &&
    Array.isArray(x.steps) &&
    x.steps.every((s) => isRecord(s) && typeof s.text === 'string' && isOptionalNumber(s.timerSeconds))
  )
}


function seedRecipes(): SavedRecipe[] {
  const saved: SavedRecipe[] = []
  for (const recipe of RECIPES) {
    saved.push({ ...recipe, slug: uniqueSlug(recipe.title, saved.map((r) => r.slug)) })
  }
  return saved
}

function readFromStorage(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every(isSavedRecipe)) return parsed
      console.warn('Saved recipes were invalid; using the built-in recipes instead.')
    }
  } catch (err) {
    // JSON.parse failed, or localStorage is blocked (some private modes)
    console.warn('Could not read saved recipes:', err)
  }
  return seedRecipes()
}

let cache: SavedRecipe[] | null = null
const listeners = new Set<() => void>()

function commit(next: SavedRecipe[]) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    // storage full or blocked: the app keeps working, it just won't persist
    console.warn('Could not save recipes:', err)
  }
  listeners.forEach((listener) => listener())
}

export function getRecipes(): SavedRecipe[] {
  cache ??= readFromStorage()
  return cache
}

// React calls this to find out when to re-render.
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // "storage" fires when ANOTHER tab changes localStorage, so tabs stay in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) {
      cache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function addRecipe(recipe: Recipe): SavedRecipe {
  const current = getRecipes()
  const saved: SavedRecipe = {
    ...recipe,
    slug: uniqueSlug(recipe.title, current.map((r) => r.slug)),
  }
  commit([...current, saved])
  return saved // so the caller can navigate to /recipe/<saved.slug>
}

export function removeRecipe(slug: string) {
  commit(getRecipes().filter((r) => r.slug !== slug))
}