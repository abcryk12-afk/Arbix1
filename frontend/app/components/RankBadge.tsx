'use client';

import { useMemo } from 'react';

type Props = {
  rankName?: string | null;
  size?: 'sm' | 'md';
};

const rankStyle = (rankName: string) => {
  const name = String(rankName || 'A1').toUpperCase();
  const idx = Math.min(Math.max(parseInt(name.slice(1), 10) || 1, 1), 7);

  if (idx <= 2) {
    return {
      bg: 'from-slate-200/30 via-slate-100/10 to-slate-400/20',
      ring: 'ring-slate-200/30',
      text: 'text-slate-100',
    };
  }

  if (idx <= 4) {
    return {
      bg: 'from-amber-300/25 via-yellow-100/10 to-amber-500/20',
      ring: 'ring-amber-200/30',
      text: 'text-amber-50',
    };
  }

  if (idx <= 6) {
    return {
      bg: 'from-cyan-300/20 via-sky-200/10 to-indigo-400/20',
      ring: 'ring-cyan-200/30',
      text: 'text-cyan-50',
    };
  }

  return {
    bg: 'from-fuchsia-300/20 via-indigo-200/10 to-cyan-400/20',
    ring: 'ring-fuchsia-200/30',
    text: 'text-fuchsia-50',
  };
};

export default function RankBadge({ rankName, size = 'sm' }: Props) {
  const safeRank = String(rankName || 'A1').toUpperCase();
  const s = useMemo(() => rankStyle(safeRank), [safeRank]);
  const dims = size === 'md' ? 'h-9 px-3 text-[12px]' : 'h-7 px-2.5 text-[11px]';

  return (
    <span
      className={
        [
          'arbix-rank-badge arbix-3d arbix-shine arbix-shine-active',
          'inline-flex items-center justify-center gap-1 rounded-xl border border-border/60',
          'bg-gradient-to-br',
          s.bg,
          'ring-1',
          s.ring,
          'shadow-theme-sm',
          'select-none',
          dims,
        ].join(' ')
      }
      aria-label={`Rank ${safeRank}`}
      title={`Rank ${safeRank}`}
    >
      <span className={['font-semibold tracking-wide', s.text].join(' ')}>{safeRank}</span>
      <span className="arbix-rank-gem" aria-hidden="true" />
    </span>
  );
}
