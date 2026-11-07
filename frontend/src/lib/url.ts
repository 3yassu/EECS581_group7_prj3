export function parseHttpUrl(text: string): URL | null {
  try {
    const parsed = new URL(text.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null
  } catch {
    return null
  }
}

// Dummy for sprint 1. Later this becomes a fetch() to the rust server.
export function importRecipe(url: string): void {
  console.log('would import:', url)
}