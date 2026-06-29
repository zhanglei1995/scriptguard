'use client';

import Link from 'next/link';
import { useState } from 'react';

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-dark/80">
      <div className="section-container">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm">
              SG
            </div>
            <span className="text-xl font-bold text-dark dark:text-white">ScriptGuard</span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-500 dark:text-gray-400"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://chromewebstore.google.com/detail/scriptguard"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Add to Chrome
            </a>
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:text-primary-500"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-200 py-4 dark:border-gray-800 md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-primary-500 dark:text-gray-400"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://chromewebstore.google.com/detail/scriptguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-2 text-sm"
              >
                Add to Chrome
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
