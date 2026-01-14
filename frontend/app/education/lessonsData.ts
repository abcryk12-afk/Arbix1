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
          'Arbix is structured around a simple flow: create account → deposit → activate package → daily profit tracking → withdrawals.',
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
        paragraphs: ['Small mistakes cost time. Use this checklist as your baseline.'],
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
