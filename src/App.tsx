import { useState } from 'react'
import LoginForm from './pages/login/loginPage'
import SignUpForm from './pages/signup/signupPage'
import DashboardPage from './pages/dashboard/dashboardPage'

type Page = 'login' | 'signup' | 'dashboard'

export default function App() {
    // TODO: replace with real authentication once there's a backend
    const [page, setPage] = useState<Page>('login')
    const [email, setEmail] = useState('')

    function signIn(email: string) {
        setEmail(email)
        setPage('dashboard')
    }

    if (page === 'login') {
        return <LoginForm onLogin={({ email }) => signIn(email)} onShowSignUp={() => setPage('signup')} />
    }

    if (page === 'signup') {
        return <SignUpForm onSignUp={({ email }) => signIn(email)} onShowLogin={() => setPage('login')} />
    }

    return <DashboardPage email={email} onLogout={() => setPage('login')} />
}
