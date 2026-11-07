import { Link, useParams } from 'react-router'
import { RECIPES } from '../types/recipe'

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

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <Link to="/" className="text-indigo-600 underline">Back to cookbook</Link>
      <h1 className="text-3xl font-bold">{recipe.title}</h1>
      <h2 className="text-xl font-semibold">Ingredients</h2>
      <ul className="list-disc pl-6">
        {recipe.ingredients.map((ing) => <li key={ing}>{ing}</li>)}
      </ul>
      <h2 className="text-xl font-semibold">Steps</h2>
      <ol className="list-decimal pl-6">
        {recipe.steps.map((step, i) => <li key={i}>{step.text}</li>)}
      </ol>
    </main>
  )
}