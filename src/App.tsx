import { useState } from 'react'
import LoginForm from './pages/login/loginPage'
import SignUpForm from './pages/signup/signupPage'
import HomePage from './pages/home/homePage'

type Page = 'login' | 'signup' | 'dashboard'

export default function App() {
    // TODO: replace with real authentication once there's a backend
    const [page, setPage] = useState<Page>('login')

    if (page === 'login') {
        return <LoginForm onLogin={() => setPage('dashboard')} onShowSignUp={() => setPage('signup')} />
    }

    if (page === 'signup') {
        return <SignUpForm onSignUp={() => setPage('dashboard')} onShowLogin={() => setPage('login')} />
    }

    return <HomePage />
}
