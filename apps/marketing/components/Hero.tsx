export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 py-24 sm:py-32 lg:py-40">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="section-container relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Keep your userscripts <span className="text-primary-400">healthy</span> and{' '}
            <span className="text-primary-400">secure</span>
          </h1>
          <p className="mt-6 text-lg text-gray-300 sm:text-xl">
            ScriptGuard monitors your userscripts in real-time, checks for updates, and alerts you
            before things break. Never lose a script again.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://chromewebstore.google.com/detail/scriptguard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-primary-900 shadow-xl transition-all hover:bg-gray-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Add to Chrome — Free
            </a>
            <a
              href="/features"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-8 py-4 text-base font-semibold text-white transition-all hover:border-gray-400"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
