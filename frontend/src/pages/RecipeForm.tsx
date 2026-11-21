import { useState } from 'react'
import type { KeyboardEvent, SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { addRecipe } from '../lib/recipeStore'
import { formatIngredient, type Ingredient } from '../types/recipe'

const inputClass = 'min-w-0 rounded-lg border border-slate-300 px-3 py-2'
const addButtonClass = 'rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50'
const removeButtonClass = 'text-sm text-rose-600 underline'

export default function RecipeForm() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<string[]>([])
  const [ingredientDraft, setIngredientDraft] = useState('')
  const [stepDraft, setStepDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function addIngredient() {
    const text = ingredientDraft.trim()
    if (text === '') {
      setError('Type the ingredient first.')
      return
    }
    // One free-text box for now
    setIngredients((list) => [...list, { quantity: '', unit: '', name: text }])
    setIngredientDraft('')
    setError(null)
  }

  function addStep() {
    const text = stepDraft.trim()
    if (text === '') {
      setError('Type the step first.')
      return
    }
    setSteps((list) => [...list, text])
    setStepDraft('')
    setError(null)
  }

  // Pressing Enter in these boxes should ADD the item, not submit the whole recipe.
  function onEnter(action: () => void) {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        action()
      }
    }
  }

  function handleSave(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (title.trim() === '') return setError('Give the recipe a title.')
    if (ingredientDraft.trim() !== '') return setError("You have an ingredient typed in that you haven't added yet.")
    if (stepDraft.trim() !== '') return setError("You have a step typed in that you haven't added yet.")
    if (ingredients.length === 0) return setError('Add at least one ingredient.')
    if (steps.length === 0) return setError('Add at least one step.')

    const saved = addRecipe({
      title: title.trim(),
      sourceUrl: '', // not imported from anywhere
      ingredients,
      steps: steps.map((text) => ({ text })),
    })
    navigate(`/recipe/${saved.slug}`)
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="new-title" className="font-medium">Title</label>
        <input id="new-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Grandma's tomato soup" className={inputClass} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">Ingredients</legend>
        {ingredients.length > 0 && (
          <ul className="flex flex-col gap-1">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>{formatIngredient(ing)}</span>
                <button type="button" className={removeButtonClass}
                  onClick={() => setIngredients((list) => list.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input aria-label="New ingredient" placeholder="1/2 cup onion, diced"
            className={`${inputClass} flex-1`} value={ingredientDraft}
            onChange={(e) => setIngredientDraft(e.target.value)} onKeyDown={onEnter(addIngredient)} />
          <button type="button" onClick={addIngredient} className={`${addButtonClass} whitespace-nowrap`}>
            Add ingredient
          </button>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">Steps</legend>
        {steps.length > 0 && (
          <ol className="flex list-decimal flex-col gap-1 pl-6">
            {steps.map((step, i) => (
              <li key={i}>
                <span className="flex items-center justify-between gap-2">
                  <span>{step}</span>
                  <button type="button" className={removeButtonClass}
                    onClick={() => setSteps((list) => list.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
        <div className="flex gap-2">
          <input aria-label="New step" placeholder={`Step ${steps.length + 1}...`}
            className={`${inputClass} flex-1`} value={stepDraft}
            onChange={(e) => setStepDraft(e.target.value)} onKeyDown={onEnter(addStep)} />
          <button type="button" onClick={addStep} className={`${addButtonClass} whitespace-nowrap`}>
            Add step
          </button>
        </div>
      </fieldset>

      {error && <p role="alert" className="text-rose-600">{error}</p>}

      <button type="submit" className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
        Save recipe
      </button>
    </form>
  )
}