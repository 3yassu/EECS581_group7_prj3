import { Link, useParams } from 'react-router'
import { RECIPES } from '../types/recipe'
import { useRecipeSteps } from '../hooks/useRecipeSteps'
import type { Recipe } from '../types/recipe'

function RecipeView({ recipe }: { recipe: Recipe }) {
  const { stepIndex, step, total, isFirst, isLast, nextStep, previousStep } =
    useRecipeSteps(recipe)

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <Link to="/" className="text-indigo-600 underline">Back to cookbook</Link>
      <h1 className="text-3xl font-bold">{recipe.title}</h1>

      <h2 className="text-xl font-semibold">Ingredients</h2>
      <ul className="list-disc pl-6">
        {recipe.ingredients.map((ing) => <li key={ing}>{ing}</li>)}
      </ul>

      {step ? (
        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Step {stepIndex + 1} of {total}
          </h2>
          <p className="text-lg">{step.text}</p>
          <div className="flex gap-2">
            <button type="button" onClick={previousStep} disabled={isFirst}
              className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">
              Previous
            </button>
            <button type="button" onClick={nextStep} disabled={isLast}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-40">
              Next
            </button>
          </div>
        </section>
      ) : (
        <p>This recipe has no steps.</p>
      )}
    </main>
  )
}

export default function RecipePage() {
  const { index } = useParams()
  const i = Number(index)
  const recipe = Number.isInteger(i) && i >= 0 ? RECIPES.at(i) : undefined

  if (!recipe) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <p>Recipe not found.</p>
        <Link to="/" className="text-indigo-600 underline">Back to cookbook</Link>
      </main>
    )
  }

  return <RecipeView recipe={recipe} />
}