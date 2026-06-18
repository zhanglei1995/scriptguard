import Hero from '@/components/Hero';
import FeatureCard from '@/components/FeatureCard';

const features = [
  {
    title: 'Script Monitoring',
    description:
      'Track the health of every installed userscript in real-time. Get notified when a script stops working or encounters errors.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: 'Health Checks',
    description:
      'Automatic periodic checks verify that your scripts are running correctly. Catch issues before they affect your browsing experience.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Alerts & Notifications',
    description:
      'Receive instant notifications when a script update is available, or when something needs your attention. Never miss a critical update.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const steps = [
  { step: '1', title: 'Install the extension', description: 'Add ScriptGuard from the Chrome Web Store in seconds.' },
  { step: '2', title: 'Auto-detect scripts', description: 'ScriptGuard automatically detects and catalogs all your userscripts.' },
  { step: '3', title: 'Stay protected', description: 'Get real-time monitoring, health checks, and instant alerts.' },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="py-24 sm:py-32">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-dark dark:text-white">Everything you need</h2>
            <p className="section-subtitle">
              ScriptGuard keeps your userscripts running smoothly with powerful monitoring and management tools.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-24 dark:border-gray-800 dark:bg-gray-900/50 sm:py-32">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-dark dark:text-white">How it works</h2>
            <p className="section-subtitle">Three simple steps to a healthier userscript experience.</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-12 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-dark dark:text-white">{step.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-dark dark:text-white">Simple, transparent pricing</h2>
            <p className="section-subtitle">Start for free. Upgrade when you need more.</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-dark">
              <h3 className="text-xl font-semibold text-dark dark:text-white">Free</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">For individuals</p>
              <p className="mt-6 text-4xl font-bold text-dark dark:text-white">$0</p>
              <ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Up to 10 monitored scripts
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Basic health checks
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Desktop notifications
                </li>
              </ul>
              <a
                href="https://chromewebstore.google.com/detail/scriptguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-8 w-full"
              >
                Get Started Free
              </a>
            </div>

            <div className="relative rounded-2xl border-2 border-primary-500 bg-white p-8 dark:bg-dark">
              <div className="absolute -top-3 right-6 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                Popular
              </div>
              <h3 className="text-xl font-semibold text-dark dark:text-white">Pro</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">For power users</p>
              <p className="mt-6 text-4xl font-bold text-dark dark:text-white">
                $4<span className="text-base font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited monitored scripts
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced health checks
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email &amp; push notifications
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Script backup &amp; versioning
                </li>
              </ul>
              <a
                href="https://chromewebstore.google.com/detail/scriptguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-8 w-full"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-24 dark:border-gray-800 dark:bg-gray-900/50 sm:py-32">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-dark dark:text-white">What users say</h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Alex', role: 'Developer', text: 'Finally I can monitor all my Tampermonkey scripts in one place. Great extension!' },
              { name: 'Sarah', role: 'Power User', text: 'The health check feature is a game changer. I know instantly when something breaks.' },
              { name: 'Mike', role: 'Script Author', text: 'I use ScriptGuard to track adoption of my userscripts. Super useful analytics.' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-dark">
                <p className="text-gray-600 dark:text-gray-400">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold dark:bg-primary-900/50">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="section-container text-center">
          <h2 className="section-title text-dark dark:text-white">Ready to get started?</h2>
          <p className="section-subtitle">Install ScriptGuard and take control of your userscripts today.</p>
          <div className="mt-10">
            <a
              href="https://chromewebstore.google.com/detail/scriptguard"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base"
            >
              Add to Chrome — Free
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
