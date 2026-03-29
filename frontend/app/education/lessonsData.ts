export type LessonKind = 'blog' | 'video' | 'pdf';

export type LessonSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type EducationLesson = {
  slug: string;
  title: string;
  description: string;
  kind: LessonKind;
  isPremium: boolean;
  duration?: string;
  youtubeUrl?: string;
  youtubeEmbedUrl?: string;
  pdfUrl?: string;
  sections?: LessonSection[];
};

export const EDUCATION_LESSONS: EducationLesson[] = [
  {
    slug: 'arbix-beginner-guide',
    title: 'Arbix Beginner Guide (Start Here)',
    description: 'A clear step-by-step guide: account, deposit, packages, ROI, and withdrawals — with safety notes.',
    kind: 'blog',
    isPremium: false,
    sections: [
      {
        heading: '1) Understand the flow',
        paragraphs: [
          'Arbix Cloud follows a simple flow: create account → deposit → activate package → daily profit tracking → withdrawals.',
          'Your dashboard shows packages, earnings, and activity. Always keep your account credentials secure.',
        ],
        bullets: [
          'Create account and verify details',
          'Deposit using the provided method',
          'Activate a package based on your plan',
          'Monitor earnings and history',
          'Withdraw profits when eligible',
        ],
      },
      {
        heading: '2) Common mistakes to avoid',
        paragraphs: ['Small mistakes can cost time. Use this checklist as a starting point.'],
        bullets: [
          'Do not share OTP/password with anyone',
          'Double-check wallet addresses before sending',
          'Avoid rushing deposits/withdrawals on unstable internet',
          'Use strong password and device security',
        ],
      },
    ],
  },
  {
    slug: 'seo-blog-ideas-arbitrage-passive-income',
    title: '10 SEO Blog Ideas: Arbitrage Trading & Passive Income',
    description: 'A ready-to-use list of SEO-friendly blog titles about arbitrage trading, smart trading, and passive income (without hype).',
    kind: 'blog',
    isPremium: false,
    sections: [
      {
        heading: 'Blog title ideas',
        paragraphs: [
          'Use these titles as topics for your education section. They are written to be clear and realistic (no guaranteed-profit language).',
        ],
        bullets: [
          'Arbitrage Trading Explained: How Price Differences Create Opportunities (and Risks)',
          'Can Arbitrage Trading Support Passive Income? A Realistic Beginner’s Guide',
          'Crypto Arbitrage vs. Traditional Arbitrage: Key Differences You Should Know',
          'Arbitrage Trading Risks: Fees, Slippage, Liquidity, and Execution Delays',
          'How Automated Arbitrage Works: What It Can (and Can’t) Do for Investors',
          'Arbitrage Strategies for Beginners: Spot vs. Cross-Exchange vs. Triangular Arbitrage',
          'Passive Income Myths in Trading: What to Expect from Systematic Strategies',
          'Risk Management for Arbitrage Trading: Practical Rules to Protect Your Capital',
          'Arbitrage Trading Tools Checklist: Data, Speed, Security, and Tracking',
          'How to Evaluate an Arbitrage Platform: Transparency, Reporting, and Safety Signals',
        ],
      },
    ],
  },
  {
    slug: 'arbitrage-trading-passive-income-realistic-guide',
    title: 'Arbitrage Trading & Passive Income (A Realistic Guide)',
    description: 'A beginner-friendly guide to arbitrage trading, how it relates to passive income, and the real-world risks to understand.',
    kind: 'blog',
    isPremium: false,
    sections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Arbitrage trading is often described as “buy where cheaper, sell where higher.” The concept is simple, but the real-world results depend on fees, execution quality, liquidity, and market conditions.',
          'This lesson is educational. It does not promise results. Markets involve risk and outcomes can vary.',
        ],
      },
      {
        heading: '1) What is arbitrage trading?',
        paragraphs: [
          'Arbitrage is a strategy that attempts to benefit from price differences of the same (or closely related) asset across different markets or exchanges. These differences can appear because of supply/demand changes, regional pricing, or short-lived inefficiencies.',
          'In many cases, the price gap is small—so understanding total costs matters as much as finding the opportunity.',
        ],
        bullets: [
          'You are capturing a price spread, not predicting direction',
          'Opportunities can disappear quickly',
          'Net outcome depends on fees + execution + liquidity',
        ],
      },
      {
        heading: '2) Why people connect arbitrage with passive income',
        paragraphs: [
          'When people say “passive income” in trading, they often mean systematic workflows that reduce manual effort. Arbitrage can be structured and repeatable, which is why some users explore it as a more system-driven approach compared to discretionary trading.',
          'However, even with automation, arbitrage is not risk-free and is not fully passive. Users still need monitoring, discipline, and risk controls.',
        ],
      },
      {
        heading: '3) Common types of arbitrage (simple overview)',
        paragraphs: [
          'There are multiple forms of arbitrage. The right approach depends on the market, the tools you use, and the practical constraints (fees, speed, liquidity).',
        ],
        bullets: [
          'Cross-exchange arbitrage: buy on one exchange, sell on another (transfer speed matters)',
          'Triangular arbitrage: convert through three pairs in a loop (precision and liquidity matter)',
          'Spread-based approaches: “arbitrage-like” strategies that rely on correlations (often higher risk)',
        ],
      },
      {
        heading: '4) The real risks: what beginners usually miss',
        paragraphs: [
          'Arbitrage can look easy on paper, but real execution has friction. Small spreads can turn negative after costs, and delayed execution can erase the opportunity.',
        ],
        bullets: [
          'Fees: maker/taker fees, withdrawals, network fees, conversion costs',
          'Slippage: you may fill at a worse price than expected',
          'Execution delay: spreads can vanish in seconds',
          'Liquidity limits: small opportunities may not scale',
          'Platform risk: outages, withdrawal delays, policy changes',
        ],
      },
      {
        heading: '5) What automation can help with (and what it cannot)',
        paragraphs: [
          'Automation can help with scanning, execution consistency, and performance tracking. It can reduce manual work and improve consistency of a strategy’s rules.',
          'But automation cannot guarantee profits or remove market and platform risks. Think of it as a tool for consistent execution—not a promise of outcomes.',
        ],
      },
      {
        heading: '6) Practical checklist before you start',
        paragraphs: [
          'If you are exploring arbitrage as a systematic approach, focus on process and measurement. Start small, track net results, and only scale when you understand the real costs and live behavior.',
        ],
        bullets: [
          'Calculate net results after all fees (not best-case fees)',
          'Test with small amounts before scaling',
          'Track performance: net P/L, drawdowns, win rate, and time periods',
          'Set risk rules: max daily loss, position sizing, and exposure limits',
          'Avoid emotional changes: treat it as a system',
        ],
      },
      {
        heading: 'Final note',
        paragraphs: [
          'If you keep your expectations realistic, focus on transparent tracking, and use risk-aware rules, you will be in a stronger position to evaluate whether arbitrage trading fits your goals.',
        ],
      },
    ],
  },
  {
    slug: 'roi-and-packages-explained',
    title: 'ROI & Packages Explained',
    description: 'What ROI means, how daily profits are calculated, and how package duration/activation works.',
    kind: 'blog',
    isPremium: false,
    sections: [
      {
        heading: 'Daily ROI basics',
        paragraphs: [
          'ROI is usually represented as a percentage. Daily earnings are generally calculated as: capital × dailyROI / 100.',
          'Package duration impacts how long the package stays active and when it can end.',
        ],
      },
      {
        heading: 'Practical tips',
        paragraphs: ['Keep records and align your package choice with your risk comfort.'],
        bullets: ['Start with a smaller capital if you are new', 'Track daily profits and withdrawals', 'Avoid over-leverage'],
      },
    ],
  },
  {
    slug: 'withdrawal-and-kyc-quick-guide',
    title: 'Withdrawals & KYC (Quick Guide)',
    description: 'How to prepare for withdrawals and complete verification smoothly.',
    kind: 'video',
    isPremium: false,
    duration: '5–10 min',
    youtubeUrl: 'https://www.youtube.com/results?search_query=kyc+withdrawal+crypto+platform+guide',
  },
  {
    slug: 'team-and-referrals',
    title: 'Team & Referral Earnings (Basics)',
    description: 'Understand referrals, levels, and how to track earnings responsibly.',
    kind: 'video',
    isPremium: false,
    duration: '6–12 min',
    youtubeUrl: 'https://www.youtube.com/results?search_query=referral+commission+system+explained',
  },
  {
    slug: 'security-checklist-pdf',
    title: 'Security Checklist (PDF)',
    description: 'A printable checklist for account safety, phishing prevention, and secure withdrawals.',
    kind: 'pdf',
    isPremium: false,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    slug: 'premium-capital-strategy',
    title: 'Premium: Capital Strategy & Risk Control',
    description: 'Position sizing, reinvest rules, and discipline to keep a stable growth curve.',
    kind: 'blog',
    isPremium: true,
    sections: [
      {
        heading: 'Position sizing rules',
        paragraphs: [
          'Use consistent position sizing. Avoid chasing losses or over-increasing capital based on emotion.',
          'Treat withdrawals and reinvestment as a system, not a reaction.',
        ],
        bullets: [
          'Define a max add-on schedule',
          'Withdraw profit on fixed intervals',
          'Keep a reserve (do not reinvest everything)',
        ],
      },
      {
        heading: 'Risk control checklist',
        paragraphs: ['Premium users should follow a written plan.'],
        bullets: ['Keep device secured', 'Never share access', 'Verify every address', 'Avoid public Wi‑Fi for sensitive actions'],
      },
    ],
  },
  {
    slug: 'premium-advanced-roi-planning-pdf',
    title: 'Premium: Advanced ROI Planning (PDF)',
    description: 'Templates and planning models for reinvestment scenarios and long-term tracking.',
    kind: 'pdf',
    isPremium: true,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    slug: 'premium-security-deep-dive',
    title: 'Premium: Security Deep Dive (Video)',
    description: 'Threat models, scam patterns, and advanced safety habits for serious investors.',
    kind: 'video',
    isPremium: true,
    duration: '10–18 min',
    youtubeUrl: 'https://www.youtube.com/results?search_query=crypto+security+phishing+scams+prevention',
  },
];
