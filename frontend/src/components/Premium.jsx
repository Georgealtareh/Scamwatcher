import React from 'react';
import { Link } from 'react-router-dom';

function Premium() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      description: "Essential protection for everyone.",
      features: [
        "Access to Live Scam Feed",
        "Basic Threat Search",
        { text: "Instant SMS Alerts", unavailable: true },
        { text: "Instant Email Alerts", unavailable: true },
        { text: "AI-Generated Threat Analysis", unavailable: true }
      ],
      buttonText: "Browse Feed",
      buttonLink: "/",
      popular: false
    },
    {
      name: "Premium Protection",
      price: "$4.99",
      period: "/month",
      description: "Total peace of mind with real-time alerts.",
      features: [
        "Access to Live Scam Feed",
        "Instant SMS & Email Alerts",
        "AI-Generated Threat Analysis",
        "Priority Fraud Reporting",
        "Family Protection (Up to 3 members)"
      ],
      buttonText: "Start 14-Day Free Trial",
      buttonLink: "/checkout",
      popular: true
    },
    {
      name: "Enterprise API",
      price: "Custom",
      period: "",
      description: "Embed live scam data into your product.",
      features: [
        "Full API Access",
        "Whitelabel Alerts",
        "Custom Data Feeds",
        "Dedicated Account Manager",
        "SLA Guarantees"
      ],
      buttonText: "Contact Sales",
      buttonLink: "mailto:api@scamwatch.test",
      popular: false
    }
  ];

  return (
    <main className="max-w-container mx-auto px-6 py-12">
      <section className="bg-blue-50 py-16 px-6 rounded-3xl text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">Stay One Step Ahead of Scammers</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          While scammers are getting smarter with AI, we use even better tech to protect you. Choose the plan that fits your security needs.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-2xl p-8 shadow-lg flex flex-col border-2 ${
              tier.popular ? 'border-primary scale-105 relative' : 'border-transparent'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest">
                MOST POPULAR
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
            <div className="text-4xl font-bold mb-2 text-dark">
              {tier.price}<span className="text-lg font-normal text-gray-500">{tier.period}</span>
            </div>
            <p className="text-gray-600 mb-8">{tier.description}</p>
            
            <ul className="space-y-4 mb-8 flex-grow">
              {tier.features.map((feature, fidx) => (
                <li key={fidx} className={`flex items-start gap-3 ${typeof feature === 'object' && feature.unavailable ? 'text-gray-400 line-through' : ''}`}>
                  {typeof feature === 'object' && feature.unavailable ? (
                    <span className="text-alert font-bold">✕</span>
                  ) : (
                    <span className="text-safety font-bold">✓</span>
                  )}
                  <span>{typeof feature === 'object' ? feature.text : feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              to={tier.buttonLink} 
              className={`w-full py-3 rounded-lg font-bold text-center transition-colors ${
                tier.popular 
                  ? 'bg-primary text-white hover:bg-blue-700' 
                  : 'bg-white border-2 border-primary text-primary hover:bg-blue-50'
              }`}
            >
              {tier.buttonText}
            </Link>
          </div>
        ))}
      </div>

      <section className="mt-24 text-center">
        <h2 className="text-3xl font-bold mb-12">Why upgrade to Premium?</h2>
        <div className="grid md:grid-cols-3 gap-12 text-left">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🚀</span> Speed Matters
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Scams often disappear within hours. Our premium users get alerts the second a threat is verified, often before it hits the news.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📱</span> On-the-Go Security
            </h3>
            <p className="text-gray-600 leading-relaxed">
              No need to check the website. Get a text directly on your phone when a high-risk scam is trending in your area.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🧠</span> AI-Powered Insights
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We don't just tell you there's a scam; we explain exactly how it works and what to look for, simplified by AI.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Premium;
