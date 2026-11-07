import { Routes, Route } from 'react-router'
import CookbookPage from './pages/CookbookPage'
import RecipePage from './pages/RecipePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CookbookPage />} />
      <Route path="/recipe/:index" element={<RecipePage />} />
    </Routes>
  )
}

export default App