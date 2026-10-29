import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

function Greeting({name}: {name: string}){
  return (
    <h1 className="text-4xl font-bold tracking-tight text-slate-900">
      {name === '' ? 'Hello, world!': `Hello, ${name}!`}
    </h1>
  )
}
function App() {
  const [name, setName] = useState('')
 
  useEffect(() => {
    document.title = name === '' ? 'Hello world' : `Hello, ${name}`
  }, [name])
 
  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }
 
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-6 py-16 text-slate-700">
      <header className="flex flex-col gap-2">
        <Greeting name={name} />
        <p>
          This is my epic hello world page. How awesome.
        </p>
      </header>
 
      <section className="flex flex-col gap-2">
        <label htmlFor="name" className="font-medium">
          What&apos;s your name?
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="type here..."
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </section>
    </main>
  )
}

export default App