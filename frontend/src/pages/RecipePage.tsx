import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useRecipeVoice, type RecipeVoiceCommand } from '../hooks/useRecipeVoice'
import { useRecipes } from '../hooks/useRecipe'
import { useRecipeSteps } from '../hooks/useRecipeSteps'
import { formatIngredient, type Recipe } from '../types/recipe'

type StepTimerState = {
  duration: number
  remaining: number
  running: boolean
  deadline: number | null
  visible: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStepTimerState(value: unknown): value is StepTimerState {
  return (
    isRecord(value) &&
    typeof value.duration === 'number' &&
    Number.isFinite(value.duration) &&
    value.duration >= 0 &&
    typeof value.remaining === 'number' &&
    Number.isFinite(value.remaining) &&
    value.remaining >= 0 &&
    typeof value.running === 'boolean' &&
    (value.deadline === null ||
      (typeof value.deadline === 'number' && Number.isFinite(value.deadline))) &&
    typeof value.visible === 'boolean' &&
    (!value.running || typeof value.deadline === 'number')
  )
}

function loadStepTimers(storageKey: string, recipe: Recipe): Record<number, StepTimerState> {
  const timers = recipe.steps.reduce<Record<number, StepTimerState>>((result, step, index) => {
    const duration = step.timerSeconds ?? 0
    result[index] = {
      duration,
      remaining: duration,
      running: false,
      deadline: null,
      visible: false,
    }
    return result
  }, {})

  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) return timers

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) throw new Error('Stored timer state is not an object.')

    for (const [indexText, value] of Object.entries(parsed)) {
      const index = Number(indexText)
      if (!Number.isInteger(index) || index < 0 || index >= recipe.steps.length) continue
      if (!isStepTimerState(value)) {
        console.warn(`Ignoring invalid timer state for recipe step ${index + 1}.`)
        continue
      }

      const remaining = value.running && value.deadline !== null
        ? Math.max(0, Math.ceil((value.deadline - Date.now()) / 1000))
        : value.remaining
      timers[index] = {
        ...value,
        remaining,
        running: value.running && remaining > 0,
        deadline: value.running && remaining > 0 ? value.deadline : null,
      }
    }
  } catch (error) {
    console.warn('Could not read saved timer state:', error)
  }

  return timers
}

function RecipeView({ recipe, recipeSlug }: { recipe: Recipe; recipeSlug: string }) {
  const { stepIndex, step, total, isFirst, isLast, nextStep, previousStep } =
    useRecipeSteps(recipe)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const timerStorageKey = `cookbook:timers:v1:${recipeSlug}`
  const [stepTimers, setStepTimers] = useState<Record<number, StepTimerState>>(
    () => loadStepTimers(timerStorageKey, recipe),
  )
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false)
  const [timerMinutesDraft, setTimerMinutesDraft] = useState('')
  const timer = stepTimers[stepIndex] ?? {
    duration: step?.timerSeconds ?? 0,
    remaining: step?.timerSeconds ?? 0,
    running: false,
    deadline: null,
    visible: false,
  }

  useEffect(() => {
    try {
      localStorage.setItem(timerStorageKey, JSON.stringify(stepTimers))
    } catch (error) {
      console.warn('Could not save timer state:', error)
    }
  }, [stepTimers, timerStorageKey])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now()
      setStepTimers((current) => {
        let updated = false
        const next = { ...current }
        for (const [index, state] of Object.entries(current)) {
          if (!state.running || state.deadline === null) continue
          const remaining = Math.max(0, Math.ceil((state.deadline - now) / 1000))
          if (remaining === state.remaining) continue
          next[Number(index)] = {
            ...state,
            remaining,
            running: remaining > 0,
            deadline: remaining > 0 ? state.deadline : null,
          }
          updated = true
        }
        return updated ? next : current
      })
    }, 250)
    return () => window.clearInterval(interval)
  }, [])

  function updateTimer(updates: Partial<StepTimerState>) {
    setStepTimers((current) => {
      const currentTimer = current[stepIndex] ?? timer
      return {
        ...current,
        [stepIndex]: { ...currentTimer, ...updates },
      }
    })
  }

  function goToNextStep() {
    setIsTimerModalOpen(false)
    nextStep()
  }

  function goToPreviousStep() {
    setIsTimerModalOpen(false)
    previousStep()
  }

  function startTimer() {
    if (timer.duration <= 0) {
      setTimerMinutesDraft('')
      setIsTimerModalOpen(true)
      return
    }
    const remaining = timer.remaining > 0 ? timer.remaining : timer.duration
    updateTimer({
      deadline: Date.now() + remaining * 1000,
      remaining,
      running: true,
      visible: true,
    })
    setLastAction('Timer started')
  }

  function pauseTimer() {
    const remaining = timer.deadline === null
      ? timer.remaining
      : Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000))
    updateTimer({ deadline: null, remaining, running: false })
    setLastAction('Timer paused')
  }

  function endTimer() {
    updateTimer({ deadline: null, running: false, remaining: 0, visible: false })
    setLastAction('Timer ended')
  }

  function restartTimer() {
    if (timer.duration <= 0) {
      setTimerMinutesDraft('')
      setIsTimerModalOpen(true)
      return
    }
    updateTimer({
      deadline: Date.now() + timer.duration * 1000,
      remaining: timer.duration,
      running: true,
      visible: true,
    })
    setLastAction('Timer restarted')
  }

  function confirmTimerDuration() {
    const minutes = Number(timerMinutesDraft)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setLastAction('Enter a duration greater than 0 minutes.')
      return
    }

    const duration = Math.round(minutes * 60)
    if (duration <= 0) {
      setLastAction('Enter a duration greater than 0 minutes.')
      return
    }

    updateTimer({
      duration,
      remaining: duration,
      running: true,
      deadline: Date.now() + duration * 1000,
      visible: true,
    })
    setIsTimerModalOpen(false)
    setLastAction('Timer started')
  }

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  function repeatCurrentStep() {
    setLastAction(`repeatStep() called - "${step?.text ?? 'No steps available'}"`)
  }

  const demoCommandHandlers: Record<RecipeVoiceCommand, () => void> = {
    next: goToNextStep,
    back: goToPreviousStep,
    repeat: repeatCurrentStep,
    'start timer': startTimer,
    'pause timer': pauseTimer,
    'end timer': endTimer,
    'stop timer': endTimer,
    'restart timer': restartTimer,
  }
  const voice = useRecipeVoice((command) => demoCommandHandlers[command]())
  const voiceMessage = voice.status === 'loading'
    ? 'Loading voice recognition...'
    : voice.status === 'error'
      ? `Voice recognition unavailable: ${voice.error ?? 'Unknown error'}`
      : voice.isAwake
        ? 'Wake word heard. Say a command within 6 seconds.'
        : 'Listening. Say "Hey Chef" to activate.'

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <Link to="/" className="text-indigo-600 underline">Back to cookbook</Link>
      <h1 className="text-3xl font-bold">{recipe.title}</h1>

      <section aria-label="Voice controls" className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <h2 className="text-xl font-semibold">Voice controls</h2>
        <p aria-live="polite" className="mt-2">{voiceMessage}</p>
        <p className="mt-1 text-sm text-slate-600">
          Commands: "next," "back," "repeat," "start timer," "pause timer,"
          "end timer," or "restart timer."
        </p>
        {lastAction && <p aria-live="polite" className="mt-2 text-sm">{lastAction}</p>}
      </section>

      {timer.visible && (
        <section aria-label="Timer" className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timer</h2>
            <output aria-live="polite" className="text-3xl font-bold tabular-nums">
              {formatTimer(timer.remaining)}
            </output>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={startTimer} disabled={timer.running}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-40">
              Start
            </button>
            <button type="button" onClick={pauseTimer} disabled={!timer.running}
              className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">
              Pause
            </button>
            <button type="button" onClick={restartTimer}
              className="rounded-lg border border-slate-300 px-4 py-2">
              Restart
            </button>
            <button type="button" onClick={endTimer}
              className="rounded-lg border border-rose-300 px-4 py-2 text-rose-700">
              End
            </button>
          </div>
        </section>
      )}

      <h2 className="text-xl font-semibold">Ingredients</h2>
      <ul className="list-disc pl-6">
        {recipe.ingredients.map((ing, i) => <li key={i}>{formatIngredient(ing)}</li>)}
      </ul>

      {step ? (
        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Step {stepIndex + 1} of {total}
          </h2>
          <p className="text-lg">{step.text}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { goToPreviousStep(); setLastAction('previousStep() called') }} disabled={isFirst}
              className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">
              Previous
            </button>
            <button type="button" onClick={() => { goToNextStep(); setLastAction('nextStep() called') }} disabled={isLast}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-40">
              Next
            </button>
          </div>
        </section>
      ) : (
        <p>This recipe has no steps.</p>
      )}

      {isTimerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="timer-duration-title"
            onSubmit={(event) => {
              event.preventDefault()
              confirmTimerDuration()
            }}
            className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="timer-duration-title" className="text-xl font-semibold">
              Set timer duration
            </h2>
            <p className="text-sm text-slate-600">
              This step does not include a timer. How many minutes?
            </p>
            <label htmlFor="timer-minutes" className="font-medium">
              Minutes
            </label>
            <input
              id="timer-minutes"
              type="number"
              min="1"
              step="1"
              required
              autoFocus
              value={timerMinutesDraft}
              onChange={(event) => setTimerMinutesDraft(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTimerModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
              >
                Start timer
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

export default function RecipePage() {
  const { slug } = useParams()
  const recipes = useRecipes()
  const recipe = recipes.find((r) => r.slug === slug)

  if (!recipe) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <p>Recipe not found.</p>
        <Link to="/" className="text-indigo-600 underline">Back to cookbook</Link>
      </main>
    )
  }

  return <RecipeView key={recipe.slug} recipe={recipe} recipeSlug={recipe.slug} />
}