import './global.css'
import { RootLayout } from 'fumadocs-ui/layouts/root'
import { baseOptions } from '@/layouts/layout.config'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout {...baseOptions}>{children}</RootLayout>
}
