import { useTheme } from './theme-provider';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', description: 'Clean and bright' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
    { value: 'ocean', label: 'Ocean', description: 'Cool blue tones' },
    { value: 'forest', label: 'Forest', description: 'Natural green hues' },
    { value: 'sunset', label: 'Sunset', description: 'Warm orange glow' },
    { value: 'system', label: 'System', description: 'Follows your OS' },
  ] as const;

  return (
    <div className="py-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {themes.map(({ value, label, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-sm transition-all',
              theme === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <span className="font-medium">{label}</span>
            <span className="text-xs opacity-70">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
