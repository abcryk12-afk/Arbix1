'use client';

type StatCardProps = {
  label: string;
  value: string;
  subLabel: string;
};

function StatCard({ label, value, subLabel }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{subLabel}</div>
    </div>
  );
}

export default function DashboardFooter() {
  const systemDailyWithdrawals = 0;
  const systemTotalWithdrawals = 0;
  const teamDailyWithdrawals = 0;
  const teamTotalWithdrawals = 0;

  return (
    <footer className="mt-10 border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-slate-100">Arbix Dashboard</div>
            <div className="mt-1 text-[11px] text-slate-400">
              System &amp; team withdrawal overview
            </div>
          </div>
          <div className="text-[11px] text-slate-500">Updated: just now</div>
        </div>

        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Daily Withdrawals (System)"
            value={`$${systemDailyWithdrawals.toFixed(2)}`}
            subLabel="All users today"
          />
          <StatCard
            label="Total Withdrawals (System)"
            value={`$${systemTotalWithdrawals.toFixed(2)}`}
            subLabel="All-time"
          />
          <StatCard
            label="Daily Withdrawals (Team)"
            value={`$${teamDailyWithdrawals.toFixed(2)}`}
            subLabel="Your network today"
          />
          <StatCard
            label="Total Withdrawals (Team)"
            value={`$${teamTotalWithdrawals.toFixed(2)}`}
            subLabel="Your network all-time"
          />
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4 text-[11px] text-slate-500">
          © 2023 Arbix. Dashboard area.
        </div>
      </div>
    </footer>
  );
}
