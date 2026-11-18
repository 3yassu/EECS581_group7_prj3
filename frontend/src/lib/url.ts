import { addRecipe } from './recipeStore'
import type { SavedRecipe } from '../types/recipe'

export function parseHttpUrl(text: string): URL | null {
  try {
    const parsed = new URL(text.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null
  } catch {
    return null
  }
}

// FAKE FAKE FAKE REMOVE THIS LATER FAKE FAKE FAKE
export function importRecipe(url: string): SavedRecipe {
  const host = new URL(url).hostname
  return addRecipe({
    title: `Imported from ${host}`,
    sourceUrl: url,
    ingredients: ['(fake ingredient)'],
    steps: [{ text: '(fake step 1)' }, { text: '(fake step 2)' }],
  })
}