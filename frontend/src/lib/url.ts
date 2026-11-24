import { addRecipe } from './recipeStore'
import type { Ingredient, Recipe, RecipeStep, SavedRecipe } from '../types/recipe'

export function parseHttpUrl(text: string): URL | null {
  try {
    const parsed = new URL(text.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null
  } catch {
    return null
  }
}

export async function importRecipe(url: string): Promise<SavedRecipe> {
  const response = await fetch(`/api/import?url=${encodeURIComponent(url)}`)
  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`)
  }

  const json: unknown = await response.json()
  const recipe = recipeFromScraped(json, url)
  if (!recipe) {
    throw new Error('The backend returned an invalid recipe')
  }

  return addRecipe(recipe)
}

//assuming this is how scraper is formatted
const TUPLE = { unit: 0, quantity: 1, name: 2 } as const

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

//cleans scraper text (?necessary?)
export function cleanText(text: string): string {
  const decoded = new DOMParser().parseFromString(text, 'text/html').documentElement.textContent ?? text
  return decoded.replace(/\s+/g, ' ').trim()
}

function toIngredient(raw: unknown): Ingredient | null {
  let quantity: unknown, unit: unknown, name: unknown
  if (Array.isArray(raw) && raw.length === 3) {
    unit = raw[TUPLE.unit]; quantity = raw[TUPLE.quantity]; name = raw[TUPLE.name]
  } else if (isRecord(raw)) {
    ({ quantity, unit, name } = raw)
  } else {
    return null
  }
  if (typeof quantity !== 'string' || typeof unit !== 'string' || typeof name !== 'string') return null
  const cleaned = { quantity: cleanText(quantity), unit: cleanText(unit), name: cleanText(name) }
  return cleaned.name === '' ? null : cleaned
}

function toStep(raw: unknown): RecipeStep | null {
  const text = typeof raw === 'string' ? raw : isRecord(raw) && typeof raw.text === 'string' ? raw.text : null
  if (text === null) return null
  const cleaned = cleanText(text)
  return cleaned === '' ? null : { text: cleaned }
}

// JSON to recipe
export function recipeFromScraped(raw: unknown, sourceUrl: string): Recipe | null {
  if (!isRecord(raw) || typeof raw.title !== 'string' || cleanText(raw.title) === '') return null
  if (!Array.isArray(raw.ingredients) || !Array.isArray(raw.steps)) return null

  const ingredients: Ingredient[] = []
  for (const item of raw.ingredients) {
    const ingredient = toIngredient(item)
    if (ingredient === null) return null
    ingredients.push(ingredient)
  }
  const steps: RecipeStep[] = []
  for (const item of raw.steps) {
    const step = toStep(item)
    if (step !== null) steps.push(step)
  }
  return { title: cleanText(raw.title), sourceUrl, ingredients, steps }
}