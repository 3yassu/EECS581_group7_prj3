import { Link } from 'react-router'
import { RECIPES } from '../types/recipe'
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { parseHttpUrl, importRecipe } from '../lib/url'

function ImportForm() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = parseHttpUrl(url)
    if (parsed === null) {
      setError('Please enter a valid http(s) link.')
      return
    }
    setError(null)
    importRecipe(parsed.href)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="recipe-url" className="font-medium">Import a recipe</label>
      <div className="flex gap-2">
        <input
          id="recipe-url"
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null) }}
          placeholder="https://..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
          Import
        </button>
      </div>
      {error && <p role="alert" className="text-rose-600">{error}</p>}
    </form>
  )
}

export default function CookbookPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-16">
      <h1 className="text-3xl font-bold">My Cookbook</h1>
      <ImportForm />
      <ul className="flex flex-col gap-2">
        {RECIPES.map((recipe, index) => (
            <li key={index}>
                <Link to={`/recipe/${index}`} className="block rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50">
              {recipe.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}