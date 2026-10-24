type NavigationProps = {
    title: string
}

export default function Navigation({ title }: NavigationProps) {
    return (
        <header className="topNav">
            <div className="topNav__logo">
                SSHOST
                <svg className="topNav__slant" viewBox="0 0 40 90" preserveAspectRatio="none" aria-hidden="true">
                    <line x1="0" y1="0" x2="40" y2="90" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>
            <h1 className="topNav__title">{title}</h1>
            <button className="topNav__avatar" aria-label="Account" />
        </header>
    )
}
