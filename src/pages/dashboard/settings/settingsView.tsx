import { useState } from 'react'
import { Sidebar, SidebarItem } from '../sidebar'

const sections = ['Account', 'Preferences'] as const
type Section = typeof sections[number]

type SettingsViewProps = {
    email: string
}

export default function SettingsView({ email }: SettingsViewProps) {
    const [section, setSection] = useState<Section>('Account')

    return (
        <div className="h-full flex flex-col md:flex-row">
            <Sidebar title="Settings">
                {sections.map((s) => (
                    <SidebarItem key={s} active={s === section} onClick={() => setSection(s)}>
                        {s}
                    </SidebarItem>
                ))}
            </Sidebar>

            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                <h1 className="text-2xl font-bold">{section}</h1>
                {section === 'Account' ? (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Signed in as <span className="font-medium">{email}</span></p>
                ) : (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Nothing here yet.</p>
                )}
            </main>
        </div>
    )
}
