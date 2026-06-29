import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'ScriptGuard pricing — free for individuals, Pro for power users.',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'For individuals getting started',
    features: [
      'Up to 10 monitored scripts',
      'Basic health checks',
      'Desktop notifications',
      'Script status dashboard',
    ],
    cta: 'Get Started Free',
    ctaHref: 'https://chromewebstore.google.com/detail/scriptguard',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$4',
    period: '/mo',
    description: 'For power users who need more',
    features: [
      'Unlimited monitored scripts',
      'Advanced health checks',
      'Email & push notifications',
      'Script backup & versioning',
      'Analytics dashboard',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaHref: 'https://chromewebstore.google.com/detail/scriptguard',
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 py-24 sm:py-32">
        <div className="section-container text-center">
          <h1 className="section-title text-white animate-fade-in-up">Pricing</h1>
          <p className="section-subtitle text-gray-300 animate-fade-in-up animate-delay-100">
            Simple, transparent pricing. Start free, upgrade when you need more.
          </p>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="section-container">
          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-primary-500 border-2 dark:bg-dark'
                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-dark'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 right-6 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold text-dark dark:text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                <p className="mt-6 text-4xl font-bold text-dark dark:text-white">
                  {plan.price}
                  {plan.period && (
                    <span className="text-base font-normal text-gray-500">{plan.period}</span>
                  )}
                </p>
                <ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-primary-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${plan.highlighted ? 'btn-primary' : 'btn-secondary'} mt-8 w-full`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
