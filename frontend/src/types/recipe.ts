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
  {
    title: 'Raisins',
    sourceUrl: 'https://en.wikipedia.org/wiki/The_California_Raisins',
    servings: 120,
    totalTimeMinutes: 0,
    ingredients: ['120 raisins'],
    steps: [],
  },
  {
    title: 'Awesome and Easy Creamy Corn Casserole',
    sourceUrl: 'https://www.allrecipes.com/recipe/18906/awesome-and-easy-creamy-corn-casserole/',
    servings: 8,
    totalTimeMinutes: 55,
    ingredients: ['1 (15 ounce) can whole kernel corn, drained', '1 (14.75 ounce) can creamed corn', '1 (8.5 ounce) package dry cornbread mix', '1 cup sour cream', '1/2 cup butter, melted', '2 large eggs, beaten'],
    steps: [
      {text: ' *makes corn casserole like a boss* ' },
    ],
  },
]