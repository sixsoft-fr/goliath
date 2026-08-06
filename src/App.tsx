import { lazy } from "react"
import { Route, Routes } from "react-router"
import AppLayout from "./components/ds/layouts/app.layout"
import { RequireAuth } from "@/modules/auth/require-auth"

const Home = lazy(() => import("@/modules/home/pages/Home"))
const NotFound = lazy(() => import("@/modules/errors/pages/NotFound"))
const Login = lazy(() => import("@/modules/auth/pages/Login"))
const Users = lazy(() => import("@/modules/users/pages/UsersPage"))
const Show = lazy(() => import("./components/ds/resources/show"))

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path=":resource/:identifier" element={<Show />} />
        <Route path="users" element={<Users />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
