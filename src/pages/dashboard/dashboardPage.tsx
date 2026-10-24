import { useState } from 'react'
import TopBar from './topBar'
import ClientsView from './clients/clientsView'
import SettingsView from './settings/settingsView'

type Tab = 'clients' | 'settings'

const tabs: { id: Tab; label: string }[] = [
    { id: 'clients', label: 'Clients' },
    { id: 'settings', label: 'Settings' },
]

type DashboardPageProps = {
    email: string
    onLogout: () => void
}

export default function DashboardPage({ email, onLogout }: DashboardPageProps) {
    const [tab, setTab] = useState<Tab>('clients')

    return (
        <div className="h-screen flex flex-col bg-white text-slate-900 dark:bg-neutral-900 dark:text-slate-50">
            <TopBar tabs={tabs} activeTab={tab} onSelectTab={setTab} email={email} onLogout={onLogout} />
            <div className="flex-1 min-h-0">
                {tab === 'clients' ? <ClientsView /> : <SettingsView email={email} />}
            </div>
        </div>
    )
}
