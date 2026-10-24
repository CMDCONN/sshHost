type TopBarProps<T extends string> = {
    tabs: { id: T; label: string }[]
    activeTab: T
    onSelectTab: (id: T) => void
    email: string
    onLogout: () => void
}

export default function TopBar<T extends string>({ tabs, activeTab, onSelectTab, email, onLogout }: TopBarProps<T>) {
    return (
        <header className="flex items-center gap-4 sm:gap-8 h-14 px-4 shrink-0 border-b border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <img src="/img/icon2.png" alt="SSHost" className="h-5 w-auto shrink-0 dark:invert" />

            <nav className="flex h-full">
                {tabs.map((tab) => {
                    const active = tab.id === activeTab
                    return (
                        <button key={tab.id} type="button" onClick={() => onSelectTab(tab.id)}
                            aria-current={active ? 'page' : undefined}
                            className={`h-full px-3 text-sm font-medium border-b-2 cursor-pointer transition-colors ${active
                                ? 'border-blue-600 text-slate-900 dark:text-slate-50'
                                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'}`}>
                            {tab.label}
                        </button>
                    )
                })}
            </nav>

            <div className="ml-auto flex items-center gap-3">
                <span className="hidden md:inline text-sm text-slate-500 dark:text-slate-400">{email}</span>
                <button type="button" onClick={onLogout}
                    className="px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-neutral-700 dark:hover:bg-neutral-800">
                    Sign out
                </button>
            </div>
        </header>
    )
}
