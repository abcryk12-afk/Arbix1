const { Op } = require('sequelize');

function startDailyProfitScheduler({ sequelize, User, Wallet, Transaction, UserPackage }) {
  const disabled = String(process.env.DISABLE_SCHEDULERS || '').toLowerCase() === 'true';
  if (disabled) return;

  const scheduleNext = () => {
    const now = new Date();
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));
    const isAfterTargetToday = now.getTime() >= target.getTime();
    if (isAfterTargetToday) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
    const delayMs = Math.max(0, target.getTime() - now.getTime());

    if (isAfterTargetToday) {
      runDailyProfitCredit({ sequelize, User, Wallet, Transaction, UserPackage }).catch((e) => {
        console.error('Daily profit job failed:', e);
      });
    }

    setTimeout(async () => {
      try {
        await runDailyProfitCredit({ sequelize, User, Wallet, Transaction, UserPackage });
      } catch (e) {
        console.error('Daily profit job failed:', e);
      } finally {
        scheduleNext();
      }
    }, delayMs);
  };

  scheduleNext();
}

function sameUtcDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

async function runDailyProfitCredit({ sequelize, User, Wallet, Transaction, UserPackage }) {
  const now = new Date();

  const activePackages = await UserPackage.findAll({
    where: {
      status: 'active',
      start_at: { [Op.lte]: now },
    },
    order: [['id', 'ASC']],
  });

  for (const pkg of activePackages) {
    if (pkg.end_at && new Date(pkg.end_at) <= now) {
      try {
        pkg.status = 'completed';
        await pkg.save();
      } catch {}
      continue;
    }

    const lastProfitAt = pkg.last_profit_at ? new Date(pkg.last_profit_at) : null;
    if (lastProfitAt && sameUtcDay(lastProfitAt, now)) continue;

    await sequelize.transaction(async (t) => {
      const capital = Number(pkg.capital || 0);
      const dailyRoi = Number(pkg.daily_roi || 0);
      if (!Number.isFinite(capital) || !Number.isFinite(dailyRoi) || capital <= 0 || dailyRoi <= 0) {
        return;
      }

      const profit = (capital * dailyRoi) / 100;
      if (!Number.isFinite(profit) || profit <= 0) {
        return;
      }

      let wallet = await Wallet.findOne({
        where: { user_id: pkg.user_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: pkg.user_id, balance: 0 }, { transaction: t });
      }

      wallet.balance = Number(wallet.balance) + profit;
      await wallet.save({ transaction: t });

      await Transaction.create(
        {
          user_id: pkg.user_id,
          type: 'profit',
          amount: profit,
          created_by: 'system',
          note: `Daily package profit (#${pkg.id} - ${pkg.package_name})`,
        },
        { transaction: t }
      );

      pkg.total_earned = Number(pkg.total_earned || 0) + profit;

      const downlineUser = await User.findByPk(pkg.user_id, { transaction: t });
      if (downlineUser) {
        const uplines = [];
        const seen = new Set([Number(pkg.user_id)]);

        let current = downlineUser;
        for (let level = 1; level <= 3; level++) {
          const nextId = current?.referred_by_id;
          if (!nextId) break;
          const nextNum = Number(nextId);
          if (!Number.isFinite(nextNum) || seen.has(nextNum)) break;
          seen.add(nextNum);
          uplines.push({ id: nextNum, level });
          current = await User.findByPk(nextNum, { transaction: t });
          if (!current) break;
        }

        const rates = { 1: 0.2, 2: 0.1, 3: 0.05 };
        for (const upline of uplines) {
          const rate = rates[upline.level] || 0;
          const commission = profit * rate;
          if (!Number.isFinite(commission) || commission <= 0) continue;

          let w = await Wallet.findOne({
            where: { user_id: upline.id },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (!w) {
            w = await Wallet.create({ user_id: upline.id, balance: 0 }, { transaction: t });
          }

          w.balance = Number(w.balance) + commission;
          await w.save({ transaction: t });

          await Transaction.create(
            {
              user_id: upline.id,
              type: 'referral_profit',
              amount: commission,
              created_by: 'system',
              note: `Referral daily profit L${upline.level} (${Math.round(rate * 100)}%) from user ${pkg.user_id} package ${pkg.package_id}`,
            },
            { transaction: t }
          );

          if (upline.level === 1 && capital >= 500) {
            const bonus = profit * 0.6;
            if (Number.isFinite(bonus) && bonus > 0) {
              w.balance = Number(w.balance) + bonus;
              await w.save({ transaction: t });

              await Transaction.create(
                {
                  user_id: upline.id,
                  type: 'referral_bonus',
                  amount: bonus,
                  created_by: 'system',
                  note: `Referral bonus L1 (60%) from user ${pkg.user_id} package ${pkg.package_id}`,
                },
                { transaction: t }
              );
            }
          }
        }
      }

      pkg.last_profit_at = now;
      await pkg.save({ transaction: t });
    });
  }
}

module.exports = {
  startDailyProfitScheduler,
  runDailyProfitCredit,
};
