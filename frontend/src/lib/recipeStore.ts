import { RECIPES } from '../types/recipe'
import type { Recipe, SavedRecipe } from '../types/recipe'
import { uniqueSlug } from './slug'

// "v1" so a future change to the saved shape can use a new key (v2) instead of
// choking on old data.
const STORAGE_KEY = 'cookbook:recipes:v1'

// Anything read from localStorage is `unknown`: types vanish at runtime and
// users (or old versions of the app) can leave anything in there.
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
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
    x.ingredients.every((i) => typeof i === 'string') &&
    Array.isArray(x.steps) &&
    x.steps.every((s) => isRecord(s) && typeof s.text === 'string' && isOptionalNumber(s.timerSeconds))
  )
}

// The hardcoded recipes are only the starting point for a brand-new visitor.
// Possibly change this so they aren't "raisins" and "bacon"
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