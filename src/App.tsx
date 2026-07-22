import { Route, Routes } from "react-router"
import Home from "./modules/home/pages/Home"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
