'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section - Mobile First Design */}
      <section className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center rounded-full bg-blue-600/10 px-4 py-2 text-sm text-blue-400 border border-blue-600/20">
              <span className="mr-2 h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              Automated Arbitrage Platform
            </div>
            
            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Earn
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Passive Income
              </span>
              Through Trading
            </h1>
            
            {/* Subheading */}
            <p className="mb-8 text-lg text-slate-300 sm:text-xl lg:text-2xl max-w-3xl mx-auto">
              Invest smartly with our automated arbitrage system. No trading experience needed - just watch your profits grow daily.
            </p>
            
            {/* CTA Buttons - Mobile Optimized */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <a 
                href="/auth/signup" 
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 sm:px-10 sm:py-4 sm:text-lg"
              >
                Start Earning Today
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href="#how-it-works" 
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-4 text-base font-semibold text-white backdrop-blur hover:bg-slate-700/50 transition-all duration-200 sm:px-10 sm:py-4 sm:text-lg"
              >
                Learn More
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-emerald-400 sm:text-4xl">$2.5M+</div>
                <div className="mt-1 text-sm text-slate-400">Trading Volume</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-blue-400 sm:text-4xl">15K+</div>
                <div className="mt-1 text-sm text-slate-400">Active Users</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-purple-400 sm:text-4xl">98.2%</div>
                <div className="mt-1 text-sm text-slate-400">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Mobile First */}
      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Start earning in 3 simple steps
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 text-2xl font-bold">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">Sign Up</h3>
                <p className="text-slate-400">
                  Create your account in minutes. No complex verification needed.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-blue-600 text-2xl font-bold">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">Invest</h3>
                <p className="text-slate-400">
                  Choose your investment plan and deposit funds securely.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-2xl font-bold">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">Earn</h3>
                <p className="text-slate-400">
                  Watch our automated system generate daily profits for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Mobile Optimized */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
              Why Choose Arbix?
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Industry-leading features for maximum returns
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur hover:bg-slate-800/70 transition-all duration-200">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-600/20 p-3 w-fit">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Lightning Fast</h3>
              <p className="text-slate-400 text-sm">
                Execute trades in milliseconds across multiple exchanges
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur hover:bg-slate-800/70 transition-all duration-200">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-emerald-600/20 to-blue-600/20 p-3 w-fit">
                <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Proven Results</h3>
              <p className="text-slate-400 text-sm">
                Back-tested algorithms with consistent profit generation
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur hover:bg-slate-800/70 transition-all duration-200">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 w-fit">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Bank-Level Security</h3>
              <p className="text-slate-400 text-sm">
                Your funds are protected with enterprise-grade security
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur hover:bg-slate-800/70 transition-all duration-200">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 p-3 w-fit">
                <svg className="h-6 w-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Daily Profits</h3>
              <p className="text-slate-400 text-sm">
                Earn consistent returns every single day
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur hover:bg-slate-800/70 transition-all duration-200">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-orange-600/20 to-red-600/20 p-3 w-fit">
                <svg className="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Referral Rewards</h3>
              <p className="text-slate-400 text-sm">
                Build passive income through our referral program
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur hover:bg-slate-800/70 transition-all duration-200">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 p-3 w-fit">
                <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Real-time Analytics</h3>
              <p className="text-slate-400 text-sm">
                Track your performance with detailed dashboards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans - Mobile First */}
      <section id="plans" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
              Investment Plans
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Choose the plan that fits your goals
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Starter Plan */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-8 backdrop-blur">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$100</span>
                  <span className="text-slate-400 ml-2">minimum</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">1.5% daily profit</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Basic analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Email support</span>
                </li>
              </ul>
              <a href="/auth/signup" className="block w-full rounded-xl bg-slate-700 px-6 py-3 text-center font-semibold hover:bg-slate-600 transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Pro Plan */}
            <div className="rounded-2xl border border-blue-600 bg-gradient-to-br from-blue-600/10 to-emerald-600/10 p-8 backdrop-blur relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </span>
              </div>
              <div className="mb-6 mt-4">
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$500</span>
                  <span className="text-slate-400 ml-2">minimum</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">2.5% daily profit</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Priority support</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Referral bonuses</span>
                </li>
              </ul>
              <a href="/auth/signup" className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3 text-center font-semibold text-white hover:shadow-lg transition-all">
                Get Started
              </a>
            </div>
            
            {/* Enterprise Plan */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-8 backdrop-blur">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$1,000</span>
                  <span className="text-slate-400 ml-2">minimum</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">3.5% daily profit</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Premium analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">24/7 dedicated support</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Custom strategies</span>
                </li>
              </ul>
              <a href="/auth/signup" className="block w-full rounded-xl bg-slate-700 px-6 py-3 text-center font-semibold hover:bg-slate-600 transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600/10 to-emerald-600/10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Join thousands of successful traders earning passive income with Arbix
          </p>
          <a 
            href="/auth/signup" 
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-10 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Your Journey Now
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
