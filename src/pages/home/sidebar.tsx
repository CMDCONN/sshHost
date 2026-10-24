type SidebarProps = {
    items: string[]
}

export default function Sidebar({ items }: SidebarProps) {
    return (
        <nav className="sideNav">
            {items.map((item) => (
                <button key={item} className="sideNav__item">{item}</button>
            ))}
        </nav>
    )
}
