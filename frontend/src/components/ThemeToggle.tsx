import { useTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon } from './icons';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title="Thème clair / sombre"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
