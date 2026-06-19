import { source } from '@/lib/source'
import {
  DocsPage,
  DocsBody,
  DocsTitle,
} from 'fumadocs-ui/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return source.generateParams()
}

export function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = source.getPage(params.slug)
  if (!page) notFound()
  return {
    title: page.data.title,
  }
}

export default async function Page({ params }: { params: { slug?: string[] } }) {
  const page = source.getPage(params.slug)
  if (!page) notFound()
  const MDX = page.data.body

  return (
    <DocsPage>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  )
}