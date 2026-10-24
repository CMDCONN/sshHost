import Navigation from "./nav.tsx";
import Sidebar from "./sidebar.tsx";

export default function HomePage() {
    return (
        <div className="dashboard">
            <Navigation title="Clients" />
            <Sidebar items={["Figure 1", "Figure 2", "Figure 3"]} />
            <main className="dashboard__content"></main>
        </div>
    )
}
