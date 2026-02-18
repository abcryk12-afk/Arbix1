export const uiThemes = {
  default: {
    id: 'default',
    label: 'Default',
    tokens: {},
  },
  aurora_glass: {
    id: 'aurora_glass',
    label: 'Aurora Glass',
    tokens: {
      '--ui-primary-from': '#8E2DE2',
      '--ui-primary-to': '#4A00E0',
      '--ui-accent-glow-1': '#FF9AEF',
      '--ui-accent-glow-2': '#C9A4FF',
      '--ui-glass-bg': '255 255 255 / 0.08',
      '--ui-glass-border': '255 255 255 / 0.15',
      '--ui-glass-shadow': '0 20px 50px rgba(0,0,0,0.15)',
      '--ui-glass-radius': '24px',
      '--ui-glass-blur': '20px',
    },
  },
};

export function normalizeUiTheme(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw || raw === 'default' || raw === 'system' || raw === 'legacy') return 'default';
  if (raw === 'aurora_glass' || raw === 'aurora-glass' || raw === 'auroraglass') return 'aurora_glass';
  return 'default';
}
