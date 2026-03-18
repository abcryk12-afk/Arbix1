'use client';

import { useEffect, useMemo, useState } from 'react';
import RankBadge from './RankBadge';

type Props = {
  open: boolean;
  onClose: () => void;
  newRank: string;
};

type Spark = { id: string; left: number; delayMs: number; size: number; drift: number };

const makeSparks = (count: number) => {
  const out: Spark[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      id: `s-${i}-${Math.random().toString(16).slice(2)}`,
      left: Math.random() * 100,
      delayMs: Math.floor(Math.random() * 500),
      size: 6 + Math.floor(Math.random() * 10),
      drift: (Math.random() - 0.5) * 80,
    });
  }
  return out;
};

export default function RankUpgradeModal({ open, onClose, newRank }: Props) {
  const [visible, setVisible] = useState(false);

  const sparks = useMemo(() => makeSparks(18), []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open && !visible) return null;

  return (
    <div
      className={
        'fixed inset-0 z-[80] flex items-center justify-center px-4 ' +
        (open ? 'opacity-100' : 'pointer-events-none opacity-0')
      }
      aria-hidden={!open}
    >
      <div
        className={
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ' +
          (open ? 'opacity-100' : 'opacity-0')
        }
        onClick={onClose}
      />

      <div
        className={
          'relative w-full max-w-md rounded-3xl border border-border bg-surface/80 p-5 shadow-theme-lg ' +
          'transition-all duration-300 will-change-transform ' +
          (open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2')
        }
        role="dialog"
        aria-modal="true"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          {sparks.map((s) => (
            <span
              key={s.id}
              className="arbix-rank-spark"
              style={
                {
                  left: `${s.left}%`,
                  animationDelay: `${s.delayMs}ms`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  ['--spark-drift' as any]: `${s.drift}px`,
                } as any
              }
            />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted">Congratulations</div>
              <div className="mt-2 text-xl font-semibold tracking-tight text-heading">Rank Upgraded</div>
              <div className="mt-2 text-[12px] text-muted">Your Rank has been upgraded to</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface/50 px-3 py-2 text-[12px] text-muted hover:text-heading"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <RankBadge rankName={newRank} size="md" />
          </div>

          <div className="mt-4 text-center text-[11px] text-subtle">
            Keep growing your team to unlock even higher ranks.
          </div>
        </div>
      </div>
    </div>
  );
}
