import type { BlogPost, BlogPostsResult } from '#/lib/blog/types'

const DEFAULT_LIMIT = 3
const FETCH_TIMEOUT_MS = 8_000

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTag(itemXml: string, tag: string): string | null {
  const cdata = itemXml.match(
    new RegExp(
      `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
      'i',
    ),
  )
  if (cdata?.[1] != null) {
    return decodeXmlEntities(cdata[1]).trim() || null
  }

  const plain = itemXml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
  )
  if (plain?.[1] == null) {
    return null
  }

  return decodeXmlEntities(plain[1]).trim() || null
}

function extractSummary(description: string | null): string | null {
  if (!description) {
    return null
  }

  // Website RSS: frontmatter blurb, then <br /><br />, then body preview
  const blurb = description.split(/<br\s*\/?\s*>/i)[0] ?? description
  const text = stripHtml(blurb)
  if (!text) {
    return null
  }

  if (text.length <= 160) {
    return text
  }

  return `${text.slice(0, 157).trimEnd()}…`
}

function parseRssItems(xml: string, limit: number): BlogPost[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  const posts: BlogPost[] = []

  for (const match of items) {
    if (posts.length >= limit) {
      break
    }

    const itemXml = match[1]
    if (!itemXml) {
      continue
    }

    const title = extractTag(itemXml, 'title')
    const url = extractTag(itemXml, 'link')
    const publishedAt = extractTag(itemXml, 'pubDate')
    if (!title || !url || !publishedAt) {
      continue
    }

    posts.push({
      title,
      url,
      publishedAt,
      summary: extractSummary(extractTag(itemXml, 'description')),
      authors: extractTag(itemXml, 'author'),
    })
  }

  return posts
}

export async function fetchLatestBlogPosts(
  limit = DEFAULT_LIMIT,
): Promise<BlogPostsResult> {
  const { serverConfig } = await import('#/lib/config')
  const feedUrl = serverConfig.blog.feedUrl

  try {
    const response = await fetch(feedUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error(
        `[blog] Feed request failed: ${response.status} ${response.statusText}`,
      )
      return { posts: [], error: 'fetch_failed' }
    }

    const xml = await response.text()
    if (!xml.includes('<item>')) {
      console.error('[blog] Feed response had no items')
      return { posts: [], error: 'invalid_response' }
    }

    return {
      posts: parseRssItems(xml, limit),
      error: null,
    }
  } catch (error) {
    console.error('[blog] Feed request threw', error)
    return { posts: [], error: 'fetch_failed' }
  }
}
