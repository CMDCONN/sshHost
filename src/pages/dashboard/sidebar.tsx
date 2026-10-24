import type { ReactNode } from 'react'

type SidebarProps = {
    title: string
    action?: ReactNode
    children: ReactNode
}

export function Sidebar({ title, action, children }: SidebarProps) {
    return (
        <aside className="flex flex-col shrink-0 max-h-64 md:max-h-none md:w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between h-14 px-4 shrink-0">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h2>
                {action}
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                {children}
            </nav>
        </aside>
    )
}

type SidebarItemProps = {
    active: boolean
    onClick: () => void
    children: ReactNode
}

export function SidebarItem({ active, onClick, children }: SidebarItemProps) {
    return (
        <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined}
            className={`w-full text-left rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${active
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200 dark:bg-neutral-800 dark:text-slate-50 dark:ring-neutral-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-neutral-900 dark:hover:text-slate-50'}`}>
            {children}
        </button>
    )
}
