import { Route, Routes } from "react-router"
import { Home } from "@/modules/home/pages"
import { NotFound } from "@/modules/errors/pages"
import { Login } from "@/modules/auth/pages"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
