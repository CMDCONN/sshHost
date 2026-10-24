import { useEffect, useState } from 'react'
import { api } from './api'
import LoginForm from './pages/login/loginPage'
import SignUpForm from './pages/signup/signupPage'
import DashboardPage from './pages/dashboard/dashboardPage'

type Page = 'loading' | 'login' | 'signup' | 'dashboard'

type User = {
    email: string
}

export default function App() {
    const [page, setPage] = useState<Page>('loading')
    const [email, setEmail] = useState('')

    function signIn(user: User) {
        setEmail(user.email)
        setPage('dashboard')
    }

    // Restore an existing session on page load
    useEffect(() => {
        api<User>('/auth/me')
            .then(signIn)
            .catch(() => setPage('login'))
    }, [])

    if (page === 'loading') {
        return null
    }

    if (page === 'login') {
        return <LoginForm
            onLogin={async (credentials) => signIn(await api<User>('/auth/login', { method: 'POST', body: credentials }))}
            onShowSignUp={() => setPage('signup')} />
    }

    if (page === 'signup') {
        return <SignUpForm
            onSignUp={async (details) => signIn(await api<User>('/auth/signup', { method: 'POST', body: details }))}
            onShowLogin={() => setPage('login')} />
    }

    return <DashboardPage email={email} onLogout={async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => {})
        setPage('login')
    }} />
}
