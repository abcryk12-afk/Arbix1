export default function HomePage() {
  return (
    <div className="min-h-screen bg-page bg-theme-page text-fg">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-24">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-theme-hero-overlay opacity-60"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse mr-2"></span>
              <span className="text-primary text-sm font-medium">Automated Arbitrage Platform</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="block">Earn</span>
              <span className="block text-transparent bg-clip-text bg-theme-text-brand">
                Passive Income
              </span>
              <span className="block text-2xl md:text-3xl lg:text-4xl mt-2 text-muted">
                Through Smart Trading
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto">
              Invest wisely with our automated arbitrage system. No trading experience needed - just watch your profits grow daily.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href="/auth/login" 
                className="inline-flex items-center justify-center px-8 py-4 bg-theme-primary text-primary-fg rounded-xl font-semibold transition-all shadow-theme-md hover:shadow-theme-lg transform hover:scale-105"
              >
                Start Earning Today
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href="#how-it-works" 
                className="inline-flex items-center justify-center px-8 py-4 bg-surface/40 text-fg rounded-xl font-semibold border border-border transition-all backdrop-blur hover:border-border2 hover:shadow-theme-sm"
              >
                Learn More
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-surface/30 rounded-lg backdrop-blur border border-border/50 shadow-theme-sm">
                <div className="text-2xl font-bold text-primary mb-1">No Experience Needed</div>
                <div className="text-sm text-muted">Fully automated system</div>
              </div>
              <div className="p-4 bg-surface/30 rounded-lg backdrop-blur border border-border/50 shadow-theme-sm">
                <div className="text-2xl font-bold text-secondary mb-1">Daily Profits</div>
                <div className="text-sm text-muted">Transparent earnings</div>
              </div>
              <div className="p-4 bg-surface/30 rounded-lg backdrop-blur border border-border/50 shadow-theme-sm">
                <div className="text-2xl font-bold text-accent mb-1">Referral Rewards</div>
                <div className="text-sm text-muted">Earn from referrals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-transparent bg-clip-text bg-theme-text-brand">Arbix</span>?
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Professional arbitrage trading with proven results and cutting-edge technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Lightning Fast Trading",
                description: "Execute trades in milliseconds across multiple exchanges for maximum profit",
                bg: "bg-theme-info"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Proven Strategy",
                description: "Back-tested algorithms with consistent profit generation and risk management",
                bg: "bg-theme-success"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: "Secure & Insured",
                description: "Bank-level security measures to protect your investments and personal data",
                bg: "bg-theme-secondary"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Multiple Income Streams",
                description: "Diversify your portfolio with various trading pairs and investment strategies",
                bg: "bg-theme-warning"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Real-time Analytics",
                description: "Track your earnings and performance with comprehensive dashboard and reports",
                bg: "bg-theme-danger"
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "24/7 Support",
                description: "Dedicated support team available round the clock to assist with any queries",
                bg: "bg-theme-primary"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-surface/30 rounded-xl p-6 backdrop-blur border border-border/50 transition-all hover:shadow-theme-md hover:transform hover:scale-105">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${feature.bg} text-primary-fg mb-4 shadow-theme-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 md:py-24 bg-theme-cta">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "$2.5M+", label: "Total Trading Volume", color: "text-primary" },
              { value: "15,000+", label: "Active Traders", color: "text-secondary" },
              { value: "98.2%", label: "Success Rate", color: "text-accent" },
              { value: "24/7", label: "Trading Support", color: "text-warning" }
            ].map((stat, index) => (
              <div key={index} className="p-6 bg-surface/30 rounded-xl backdrop-blur border border-border/50 shadow-theme-sm">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-transparent bg-clip-text bg-theme-text-brand">Arbix</span> Works
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Start earning passive income in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Create your account in minutes with our simple registration process",
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Invest",
                description: "Deposit funds and let our automated system start trading for you",
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Earn",
                description: "Watch your profits grow daily with automated arbitrage trading",
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                )
              }
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-6xl font-bold text-subtle/20">{item.step}</div>
                <div className="bg-surface/30 rounded-xl p-8 backdrop-blur border border-border/50 transition-all hover:shadow-theme-md hover:border-border2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-theme-primary rounded-xl text-primary-fg mb-4 shadow-theme-sm">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-theme-cta">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your <span className="text-transparent bg-clip-text bg-theme-text-brand">Journey</span>?
            </h2>
            <p className="text-lg text-muted mb-8">
              Join thousands of successful traders earning passive income with Arbix
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/auth/login" 
                className="inline-flex items-center justify-center px-8 py-4 bg-theme-primary text-primary-fg rounded-xl font-semibold transition-all shadow-theme-md hover:shadow-theme-lg transform hover:scale-105"
              >
                Start Earning Today
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href="/auth/login" 
                className="inline-flex items-center justify-center px-8 py-4 bg-surface/40 text-fg rounded-xl font-semibold border border-border transition-all backdrop-blur hover:border-border2 hover:shadow-theme-sm"
              >
                Login to Account
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
