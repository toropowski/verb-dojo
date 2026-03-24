import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';

export function AppShell() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <main className="pb-[76px] max-w-2xl mx-auto px-4">
        <Outlet />
      </main>
      <Nav />
    </div>
  );
}
