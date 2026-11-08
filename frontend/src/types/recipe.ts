export type RecipeStep = {
  text: string
  timerSeconds?: number   
}

export type Recipe = {
  title: string
  sourceUrl: string
  servings?: number
  totalTimeMinutes?: number
  ingredients: string[]
  steps: RecipeStep[]
}

//hardcoded for testing
export const RECIPES: Recipe[] = [
  {
    title: 'Thick-Cut Bacon in the Oven',
    sourceUrl: 'https://www.allrecipes.com/recipe/281936/thick-cut-bacon-in-the-oven/',
    servings: 8,
    totalTimeMinutes: 20,
    ingredients: ['16 slices thick-cut bacon'],
    steps: [
      { text: 'Preheat the oven to 400 degrees F (200 degrees C). ' },
      { text: 'Line a rimmed baking sheet with aluminum foil and place a baking rack on top. Arrange bacon strips on the baking rack. ' },
      { text: 'Bake in the preheated oven until crispy, 15 to 20 minutes.', timerSeconds: 900 },
    ],
  },
]