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
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title="Light / dark theme"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
