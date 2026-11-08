import { useState } from 'react'
import type { Recipe } from '../types/recipe'

export function useRecipeSteps(recipe: Recipe) {
  const [stepIndex, setStepIndex] = useState(0)

  const total = recipe.steps.length
  const lastIndex = Math.max(total - 1, 0) // 0 if a recipe has no steps

  const nextStep = () => setStepIndex((i) => Math.min(i + 1, lastIndex))
  const previousStep = () => setStepIndex((i) => Math.max(i - 1, 0))

  return {
    stepIndex,                         
    step: recipe.steps.at(stepIndex), 
    total,
    isFirst: stepIndex === 0,
    isLast: stepIndex >= lastIndex,
    nextStep,
    previousStep,
  }
}