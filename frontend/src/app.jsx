import { Navigate, Route, Routes } from 'react-router-dom'
import useAuthStore from './store/authStore'
import {
    LoginPage,
    RegisterPage,
    ForgotPasswordPage,
    ResetPasswordPage,
} from './pages/AuthPages'
import DashboardPage from './pages/DashboardPage'

export default function App() {
    const token = useAuthStore((state) => state.token)

    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
            />

            <Route
                path="/login"
                element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />

            <Route
                path="/register"
                element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />

            <Route
                path="/forgot-password"
                element={token ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
            />

            <Route
                path="/reset-password"
                element={token ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
            />

            <Route
                path="/dashboard"
                element={token ? <DashboardPage /> : <Navigate to="/login" replace />}
            />

            <Route
                path="*"
                element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
            />
        </Routes>
    )
}