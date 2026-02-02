'use client';

const categories = [
  'General',
  'Investment & Trading',
  'Withdrawals & Security',
] as const;

type Category = (typeof categories)[number];

type FaqItem = {
  id: string;
  category: Category;
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  // GENERAL
  {
    id: 'q1',
    category: 'General',
    question: 'What is Arbix?',
    answer:
      'Arbix is an automated arbitrage trading platform that aims to generate passive profits by taking advantage of price differences between multiple crypto exchanges. All trading logic is handled by the system, so you do not need to trade manually.',
  },
  {
    id: 'q2',
    category: 'General',
    question: 'Is Arbix legal and legitimate?',
    answer:
      'Arbix operates as a registered, KYC-compliant platform that follows transparent reporting practices, encrypted data protection and regulated security standards. However, no investment is ever completely risk-free and results can vary over time.',
  },
  {
    id: 'q3',
    category: 'General',
    question: 'Do I need trading experience to use Arbix?',
    answer:
      'No. Arbix is built as a fully automated system. You simply invest according to your chosen plan; the platform handles market scanning, trade execution and profit calculation on your behalf.',
  },
  {
    id: 'q4',
    category: 'General',
    question: 'Is Arbix an MLM or an investment platform?',
    answer:
      'Arbix is primarily an automated trading and arbitrage platform. The referral program is optional and provides an additional income opportunity on top of trading profits, but it is not mandatory to participate.',
  },
  {
    id: 'q5',
    category: 'General',
    question: 'What is the minimum investment amount?',
    answer:
      'You can start with a plan that matches your budget. We generally recommend starting with a smaller amount, observing performance, and then increasing gradually. Exact minimum amounts are defined on the Profit Plan page.',
  },

  // INVESTMENT & TRADING
  {
    id: 'q6',
    category: 'Investment & Trading',
    question: 'What is arbitrage trading?',
    answer:
      'Arbitrage trading is a low-risk strategy where the system buys an asset on one exchange at a lower price and sells it on another exchange at a higher price, capturing the difference as profit. It is based on price spreads and mathematics, not on guessing market direction.',
  },
  {
    id: 'q7',
    category: 'Investment & Trading',
    question: 'How are profits calculated in Arbix?',
    answer:
      'Each time a trade is closed, the system updates the overall profit pool. According to the rules of each investment plan, earnings are then credited to user wallets on a daily basis. For transparency, users can also see daily trade snapshots and detailed logs.',
  },
  {
    id: 'q8',
    category: 'Investment & Trading',
    question: 'Are profits guaranteed?',
    answer:
      'No trading platform can guarantee profits. Arbix uses an arbitrage-based approach to help minimise risk and smooth returns, but market conditions can always change. Past performance has been consistent, but it is never a guarantee of future results.',
  },
  {
    id: 'q9',
    category: 'Investment & Trading',
    question: 'Can I withdraw my investment at any time?',
    answer:
      'This depends on the specific investment plan you choose. Some plans may have a lock-in period, while others can offer more flexible access. Full details are always provided in the Profit Plan section.',
  },
  {
    id: 'q10',
    category: 'Investment & Trading',
    question: 'Where can I see daily trading reports?',
    answer:
      'Inside your dashboard, the "Trade Logs" section shows detailed daily trading history. On the public side, the Home and How It Works pages provide a "Today\'s Trading Snapshot" for a quick overview.',
  },

  // WITHDRAWALS & SECURITY
  {
    id: 'q11',
    category: 'Withdrawals & Security',
    question: 'How do withdrawals work?',
    answer:
      'You can submit a withdrawal request directly from your dashboard in the "Withdraw" section. Processing times typically range from X to Y hours depending on network conditions and internal checks (exact timings are defined by the platform).',
  },
  {
    id: 'q12',
    category: 'Withdrawals & Security',
    question: 'Are my funds safe with Arbix?',
    answer:
      'Arbix uses multiple layers of security, including SSL encryption, secured wallet infrastructure, anti-fraud monitoring, KYC/AML compliance and encrypted storage for sensitive data. While no system is 100% risk-free, we follow industry best practices to protect your funds.',
  },
  {
    id: 'q13',
    category: 'Withdrawals & Security',
    question: 'Why is KYC required?',
    answer:
      'KYC (Know-Your-Customer) is required for security and regulatory compliance. It helps prevent fraud, scams and unauthorised access, and is a standard part of responsible financial platforms.',
  },
  {
    id: 'q14',
    category: 'Withdrawals & Security',
    question: 'Can I withdraw referral income?',
    answer:
      'Yes. All referral bonuses are withdrawable, subject to the applicable plan rules and any minimum withdrawal limits that may apply.',
  },
  {
    id: 'q15',
    category: 'Withdrawals & Security',
    question: 'How can I contact support if I have an issue?',
    answer:
      'The Arbix Support team is available 24/7 through live chat, email and other channels such as WhatsApp or Telegram (depending on how the platform is configured). Contact options are clearly listed on the Support or Contact Us page.',
  },
];

import { useState } from 'react';

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('General');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="bg-page text-fg">
      {/* Hero / Intro */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            FAQ
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            Clear answers to the most common questions about Arbix. Transparency and
            clarity are our first priorities. If your question is not listed here,
            our Support team is always available to help.
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 pb-2 pt-4 md:pt-6">
          <div className="flex gap-2 overflow-x-auto pb-2 text-xs text-muted">
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenId(null);
                  }}
                  className={
                    'whitespace-nowrap rounded-full border px-3 py-1 transition ' +
                    (isActive
                      ? 'border-border bg-surface/40 text-fg'
                      : 'border-border bg-muted text-muted hover:opacity-95')
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
          <div className="space-y-3">
            {filteredFaqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface/40"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-medium text-heading md:text-sm"
                  >
                    <span>{item.question}</span>
                    <span
                      className={
                        'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ' +
                        (isOpen
                          ? 'border-border bg-surface/40 text-fg'
                          : 'border-border text-muted')
                      }
                    >
                      {isOpen ? '-' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border px-4 py-3 text-[11px] text-muted md:text-xs">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="rounded-2xl border border-border bg-surface/40 p-5 text-sm text-fg">
            <h2 className="text-base font-semibold text-heading md:text-lg">
              Still Have Questions?
            </h2>
            <p className="mt-2 text-xs text-muted md:text-sm">
              Our Support team is always here to help you with any additional
              questions or concerns.
            </p>
            <button className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition hover:opacity-95">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
