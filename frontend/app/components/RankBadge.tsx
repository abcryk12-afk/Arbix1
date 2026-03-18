'use client';

import { useMemo } from 'react';

type Props = {
  rankName?: string | null;
  size?: 'sm' | 'md';
};

const normalizeRank = (value: string) => {
  const s = String(value || '').trim().toUpperCase();
  if (/^A[1-7]$/.test(s)) return s;
  return 'A1';
};

export default function RankBadge({ rankName, size = 'sm' }: Props) {
  const safeRank = useMemo(() => normalizeRank(String(rankName || 'A1')), [rankName]);
  const dims = size === 'md' ? 'h-9 px-3 text-[12px]' : 'h-7 px-2.5 text-[11px]';

  return (
    <span
      className={
        [
          `arbix-rank-badge arbix-rank-${safeRank.toLowerCase()} arbix-3d arbix-shine arbix-shine-active`,
          'inline-flex items-center justify-center gap-1 rounded-xl border border-border/60',
          'shadow-theme-sm',
          'select-none',
          dims,
        ].join(' ')
      }
      data-rank={safeRank}
      aria-label={`Rank ${safeRank}`}
      title={`Rank ${safeRank}`}
    >
      <span className="arbix-rank-text font-semibold tracking-wide">{safeRank}</span>
      <span className="arbix-rank-gem" aria-hidden="true" />
    </span>
  );
}
