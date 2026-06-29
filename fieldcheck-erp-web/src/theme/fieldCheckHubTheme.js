export const fieldCheckHubTheme = {
  colors: {
    ink: '#111827',
    muted: '#667085',
    navy: '#0b2f52',
    navy2: '#123c69',
    green: '#087f3a',
    blue: '#1f7ae0',
    amber: '#f59e0b',
    red: '#dc2626',
    purple: '#7c3aed',
    bg: '#f5f7fb',
    panel: '#ffffff',
    line: '#dce2e9',
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
  shadow: '0 16px 38px rgba(16, 47, 82, .10)',
};

export function applyFieldCheckHubTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(fieldCheckHubTheme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--hub-${key}`, value);
  });
  root.style.setProperty('--hub-shadow', fieldCheckHubTheme.shadow);
}
