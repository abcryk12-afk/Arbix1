'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'bot' | 'user';
  text: string;
};

function getBotReply(raw: string) {
  const text = raw.trim().toLowerCase();
  if (!text) return "Please type a message so I can help.";

  if (text.includes('withdraw') || text.includes('withdrawal')) {
    return 'For withdrawals: make sure your wallet address is correct, your account is verified (KYC if required), and you have sufficient available balance. If you share your registered email, I can guide you to the right steps.';
  }

  if (text.includes('deposit') || text.includes('top up') || text.includes('fund')) {
    return 'For deposits: confirm the network, address, and transaction hash (TXID). If your deposit is pending, it may need confirmations. Share the TXID and I will help you track it.';
  }

  if (text.includes('kyc') || text.includes('verification') || text.includes('cnic') || text.includes('passport')) {
    return 'For KYC/verification: use clear photos, matching name details, and ensure documents are not expired. If you tell me the error you see, I can suggest the fix.';
  }

  if (text.includes('login') || text.includes('password') || text.includes('otp')) {
    return 'If you can’t log in: try resetting your password, check spam for OTP emails, and confirm the email is correct. If it still fails, share the exact message on screen.';
  }

  if (text.includes('agent') || text.includes('human')) {
    return 'I can help right away. If you want a human agent, please email support@arbix.cloud with your registered email and a short summary, and our team will respond as soon as possible.';
  }

  return 'Thanks — please share a little more detail (registered email + what you’re trying to do). I can help with deposits, withdrawals, account access, and verification.';
}

export default function ContactPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'm1',
      role: 'bot',
      text: 'Hi! I’m Arbix Support Assistant. What do you need help with today — deposit, withdrawal, account access, or verification?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isChatOpen) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isChatOpen, chatMessages.length]);

  const openChat = () => {
    setIsChatOpen(true);
    setTimeout(() => chatInputRef.current?.focus(), 50);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const sendChatMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    const botText = getBotReply(trimmed);
    const botMsg: ChatMessage = {
      id: `b-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: 'bot',
      text: botText,
    };

    setTimeout(() => {
      setChatMessages((prev) => [...prev, botMsg]);
    }, 350);
  };

  const handleSupportFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormNotice(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const subjectKey = String(fd.get('subject') || 'account').trim();
    const message = String(fd.get('message') || '').trim();

    const subjectMap: Record<string, string> = {
      account: 'Account Issue',
      deposit: 'Deposit / Withdrawal',
      technical: 'Technical Support',
      kyc: 'KYC / Verification',
      other: 'Other',
    };

    const subject = `Arbix Support — ${subjectMap[subjectKey] || 'Support Request'}`;
    const body = `Full Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`;

    const mailto = `mailto:support@arbix.cloud?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setFormNotice('Opening your email app… If it doesn’t open, please email support@arbix.cloud.');
  };

  return (
    <div className="bg-page text-fg">
      {/* SECTION 1 — Hero / Intro */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            SUPPORT
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            We&apos;re Here to Help — Contact Arbix Support
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            If you have any questions about investing, trading, deposits, withdrawals, or
            your account, our Support team is available 24/7 to assist you.
          </p>
        </div>
      </section>

      {/* SECTION 2 — Quick Support Blocks */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Quick Support Options
          </h2>
          <p className="mt-2 text-sm text-muted">
            Choose one of the primary support channels below to get help as fast as
            possible.
          </p>

          <div className="mt-6 grid gap-4 text-xs text-muted sm:grid-cols-2">
            {/* Live Chat */}
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-heading">
                Live Chat Support
              </p>
              <p className="mt-1 text-sm font-semibold text-heading">
                Chat with support in real time
              </p>
              <p className="mt-2 text-muted">
                Typical reply time: 2–5 minutes. Best for quick questions and urgent help.
              </p>
              <button
                type="button"
                onClick={openChat}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition hover:opacity-95"
              >
                Start Live Chat
              </button>
            </div>

            {/* Email */}
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-info">
                Email Support
              </p>
              <p className="mt-1 text-sm font-semibold text-heading">
                Best for verification & detailed requests
              </p>
              <p className="mt-2 text-muted">
                Ideal for KYC issues, formal documentation, and account-related investigations.
              </p>
              <a
                href="mailto:support@arbix.cloud"
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-xs font-medium text-fg transition hover:opacity-95"
              >
                support@arbix.cloud
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Contact Form */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Send Us a Message
          </h2>
          <p className="mt-2 text-sm text-muted">
            Prefer to contact us via form? Fill in your details below and our team
            will get back to you as soon as possible.
          </p>

          <form
            className="mt-6 space-y-4 text-xs text-muted"
            onSubmit={handleSupportFormSubmit}
          >
            <div>
              <label className="mb-1 block text-[11px] text-muted" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-fg shadow-theme-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-fg shadow-theme-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted" htmlFor="subject">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-fg shadow-theme-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                defaultValue="account"
              >
                <option value="account">Account Issue</option>
                <option value="deposit">Deposit / Withdrawal</option>
                <option value="technical">Technical Support</option>
                <option value="kyc">KYC / Verification</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-fg shadow-theme-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="Describe your question or issue in a few lines"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition hover:opacity-95"
            >
              Submit Request
            </button>

            {formNotice ? (
              <p className="mt-2 text-[11px] text-muted">{formNotice}</p>
            ) : null}

            <p className="mt-2 text-[10px] text-muted">
              We never share your information with third parties. Your data is used
              only to support and improve your experience with Arbix.
            </p>
          </form>
        </div>
      </section>

      {/* SECTION 4 — Support Categories */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Support Categories
          </h2>
          <p className="mt-2 text-sm text-muted">
            Quickly find the type of help you need, even before opening a support
            ticket.
          </p>

          <div className="mt-6 grid gap-4 text-xs text-muted sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Account Support</p>
              <p className="mt-2 text-muted">
                Login issues, password reset, account access and KYC guidance.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Investment &amp; Trading</p>
              <p className="mt-2 text-muted">
                Plan selection, profit updates and trading snapshot information.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Withdrawals</p>
              <p className="mt-2 text-muted">
                Withdrawal timing, fees, wallet verification and related queries.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Compliance</p>
              <p className="mt-2 text-muted">
                KYC/AML, identity verification and security concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Corporate Information */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Corporate Information
          </h2>
          <p className="mt-2 text-sm text-muted">
            A brief overview of the company behind the Arbix platform.
          </p>

          <div className="mt-4 space-y-1 text-xs text-muted">
            <p>
              <span className="font-semibold text-heading">Registered Business Name:</span>{' '}
              Arbix Technologies (placeholder)
            </p>
            <p>
              <span className="font-semibold text-heading">Location:</span>{' '}
              Dubai • London • Karachi (city-level only, for illustration)
            </p>
            <p>
              <span className="font-semibold text-heading">Support Hours:</span> 24/7
            </p>
            <p>
              <span className="font-semibold text-heading">Compliance Email:</span>{' '}
              compliance@arbix.cloud
            </p>
          </div>

          <p className="mt-3 text-[11px] text-muted">
            Note: Detailed legal and registered address information is available in
            the Terms &amp; Conditions section, following industry best practice.
          </p>
        </div>
      </section>

      {/* SECTION 6 — Trust & Security Notes */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Your Security is Our Priority
          </h2>
          <div className="mt-4 space-y-2 text-xs text-muted">
            <p>✔ SSL encrypted communication</p>
            <p>✔ KYC / AML compliant onboarding</p>
            <p>✔ Active anti-fraud monitoring</p>
          </div>
          <p className="mt-3 text-[11px] text-muted">
            The Arbix system uses enterprise-grade security protocols to help
            protect every investor&apos;s data and funds.
          </p>
        </div>
      </section>

      {/* SECTION 7 — Final CTA */}
      <section className="bg-page">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="text-xl font-semibold text-heading md:text-2xl">
            Need Immediate Help?
          </h2>
          <p className="mt-3 text-sm text-muted">
            Our team is ready to guide you through any question or issue you may
            have.
          </p>
          <button
            type="button"
            onClick={openChat}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-fg shadow-theme-sm transition hover:opacity-95"
          >
            Start Live Chat Now
          </button>
        </div>
      </section>

      {isChatOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm backdrop-brightness-50" onClick={closeChat} />
          <div className="absolute bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-page shadow-theme-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-heading">Arbix Live Chat</p>
                <p className="text-[11px] text-muted">Support Assistant</p>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-fg transition hover:opacity-95"
              >
                Close
              </button>
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto px-4 py-3 text-xs">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-fg'
                        : 'max-w-[85%] rounded-2xl border border-border bg-surface/40 px-3 py-2 text-fg'
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t border-border px-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage(chatInput);
              }}
            >
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                type="text"
                className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-fg shadow-theme-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="Type your message…"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-fg shadow-theme-sm transition hover:opacity-95"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
