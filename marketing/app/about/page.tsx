import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about ScriptGuard — the userscript health monitoring platform.',
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 py-24 sm:py-32">
        <div className="section-container text-center">
          <h1 className="section-title text-white animate-fade-in-up">About ScriptGuard</h1>
          <p className="section-subtitle text-gray-300 animate-fade-in-up animate-delay-100">
            Making userscripts reliable since 2024.
          </p>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="section-container">
          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-dark dark:text-white">Our Mission</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                ScriptGuard was built to solve a simple problem: userscripts break, and nobody notices until it&apos;s too late.
                We believe every user deserves to know the health of their browser extensions and userscripts.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-dark dark:text-white">Why ScriptGuard?</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Userscripts power millions of browsing experiences — from ad blockers to productivity tools.
                But unlike proper software, they have no built-in health monitoring. ScriptGuard fills that gap
                with real-time monitoring, automatic health checks, and instant alerts.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-dark dark:text-white">Open Source</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                ScriptGuard is open source. We believe in transparency and community-driven development.
                Check out our code on GitHub and contribute to making userscripts better for everyone.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <a
                href="https://github.com/scriptguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                View on GitHub
              </a>
              <a
                href="https://chromewebstore.google.com/detail/scriptguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Add to Chrome
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
