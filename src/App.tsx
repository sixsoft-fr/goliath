import { lazy } from "react"
import { Route, Routes } from "react-router";
import AppLayout from "./components/ds/layouts/app.layout";

const Home = lazy(() => import("@/modules/home/pages/Home"))
const NotFound = lazy(() => import("@/modules/errors/pages/NotFound"))
const Login = lazy(() => import("@/modules/auth/pages/Login"))

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="app" element={<AppLayout />}>
        <Route index element={<Home />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
