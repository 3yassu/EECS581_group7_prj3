export type RecipeStep = {
  text: string
  timerSeconds?: number   
}

export type Ingredient = {
  quantity: string 
  unit: string     
  name: string     
}

export type Recipe = {
  title: string
  sourceUrl: string
  servings?: number
  totalTimeMinutes?: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
}

export type SavedRecipe = Recipe & { slug: string }

export function formatIngredient({ quantity, unit, name }: Ingredient): string {
  return [quantity, unit, name].filter((part) => part !== '').join(' ')
}

//hardcoded for testing
export const RECIPES: Recipe[] = [
  {
    title: 'Thick-Cut Bacon in the Oven',
    sourceUrl: 'https://www.allrecipes.com/recipe/281936/thick-cut-bacon-in-the-oven/',
    servings: 8,
    totalTimeMinutes: 20,
    ingredients: [{quantity: '16', unit: 'slices', name: "thick-cut bacon"}],
    steps: [
      { text: 'Preheat the oven to 400 degrees F (200 degrees C). ' },
      { text: 'Line a rimmed baking sheet with aluminum foil and place a baking rack on top. Arrange bacon strips on the baking rack. ' },
      { text: 'Bake in the preheated oven until crispy, 15 to 20 minutes.', timerSeconds: 900 },
    ],
  },
  {
    title: 'Raisins',
    sourceUrl: 'https://en.wikipedia.org/wiki/The_California_Raisins',
    servings: 120,
    totalTimeMinutes: 0,
    ingredients: [{quantity: '120', unit: '', name: 'raisins'}],
    steps: [],
  },
  {
    title: 'Awesome and Easy Creamy Corn Casserole',
    sourceUrl: 'https://www.allrecipes.com/recipe/18906/awesome-and-easy-creamy-corn-casserole/',
    servings: 8,
    totalTimeMinutes: 55,
    ingredients: [{quantity: '1', unit: '15 ounce can', name: 'whole kernel corn, drained'}, {quantity: '1', unit: '14.75 ounce can', name: 'creamed corn'}],
    steps: [
      {text: ' *makes corn casserole like a boss* ' },
    ],
  },
]