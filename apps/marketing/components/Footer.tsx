import Link from 'next/link';

const footerLinks = {
  product: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: 'https://chromewebstore.google.com/detail/scriptguard', label: 'Chrome Store' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: 'https://github.com/scriptguard', label: 'GitHub' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-dark">
      <div className="section-container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm">
                SG
              </div>
              <span className="text-xl font-bold text-dark dark:text-white">ScriptGuard</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Monitor, manage, and protect your userscripts with ease.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark dark:text-white">Product</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-primary-500 dark:text-gray-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark dark:text-white">Company</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-primary-500 dark:text-gray-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark dark:text-white">Legal</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-primary-500 dark:text-gray-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            &copy; {new Date().getFullYear()} ScriptGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
