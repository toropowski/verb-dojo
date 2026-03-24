import { NavLink } from 'react-router-dom';

const TABS = [
  {
    to: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
        />
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/learn',
    label: 'Practice',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/reference',
    label: 'Reference',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 22h16v-5H6.5A2.5 2.5 0 004 19.5zM4 19.5V4a1 1 0 011-1h14a1 1 0 011 1v13"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0}
        />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor" strokeWidth={active ? 2.8 : 2} strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/85 backdrop-blur-xl border-t border-[var(--color-border)]">
      <div className="max-w-2xl mx-auto flex items-stretch">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => [
              'flex flex-col items-center justify-center flex-1 py-2 pb-safe gap-0.5',
              'transition-colors duration-150 min-h-[60px]',
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text3)] hover:text-[var(--color-text2)]',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                {tab.icon(isActive)}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
