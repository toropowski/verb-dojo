import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { Reference } from './pages/Reference';
import { Progress } from './pages/Progress';
import { useSettingsStore } from './store/useSettingsStore';

function ThemeInit() {
  const { theme } = useSettingsStore();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInit />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/reference" element={<Reference />} />
          <Route path="/progress" element={<Progress />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
