import { useSyncExternalStore } from 'react'
import { getRecipes, subscribe } from '../lib/recipeStore'
 
// Components call this to read the saved recipes
export function useRecipes() {
  return useSyncExternalStore(subscribe, getRecipes)
}
