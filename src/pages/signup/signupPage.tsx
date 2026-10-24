import { useState } from 'react'

export type SignUpDetails = {
    email: string
    password: string
}

type SignUpFormProps = {
    onSignUp: (details: SignUpDetails) => Promise<void>
    onShowLogin: () => void
}

export default function SignUpForm({ onSignUp, onShowLogin }: SignUpFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    return (
        <main className="bg-gray-50 px-4 md:px-8 dark:bg-neutral-900">
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="max-w-md w-full">
                    <img
                        src="/img/icon.png"
                        alt="logo"
                        className="w-50 h-50 object-contain mb-8 mx-auto block"
                    />

                    <div
                        className="p-6 rounded-lg bg-white border border-slate-300 shadow-xs md:p-8 dark:bg-neutral-800 dark:border-neutral-700">
                        <h1 className="text-slate-900 text-center text-3xl font-bold dark:text-slate-50">Sign up</h1>

                        <form className="space-y-6 mt-10" onSubmit={async (e) => {
                            e.preventDefault()
                            if (password !== confirmPassword) {
                                setError('Passwords do not match')
                                return
                            }
                            setError('')
                            setSubmitting(true)
                            try {
                                await onSignUp({ email, password })
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Sign up failed')
                                setSubmitting(false)
                            }
                        }}>
                            <div>
                                <label htmlFor="email"
                                    className="mb-2 text-slate-900 font-medium text-sm inline-block dark:text-slate-50">Email</label>
                                <input type="email" id="email" name="email" placeholder="example@example.com" required
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-700 dark:outline-neutral-600" />
                            </div>
                            <div>
                                <label htmlFor="password"
                                    className="mb-2 text-slate-900 font-medium text-sm inline-block dark:text-slate-50">Password</label>
                                <input type="password" id="password" name="password" placeholder="••••••••" required
                                    minLength={8} autoComplete="new-password"
                                    value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
                                    className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-700 dark:outline-neutral-600" />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword"
                                    className="mb-2 text-slate-900 font-medium text-sm inline-block dark:text-slate-50">Confirm password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="••••••••" required
                                    autoComplete="new-password"
                                    value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                                    className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-700 dark:outline-neutral-600" />
                                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                            </div>

                            <button type="submit" disabled={submitting}
                                className="disabled:opacity-60 w-full py-2 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                {submitting ? 'Creating account…' : 'Create account'}</button>

                            <div className="text-slate-900 text-sm text-center dark:text-slate-50">Already have an account? <button type="button" onClick={onShowLogin}
                                className="text-blue-700 hover:underline ml-1 font-medium cursor-pointer dark:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Sign
                                in</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
