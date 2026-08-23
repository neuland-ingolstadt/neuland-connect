export type BlogPost = {
  title: string
  url: string
  publishedAt: string
  summary: string | null
  authors: string | null
}

export type BlogPostsResult = {
  posts: BlogPost[]
  error: 'fetch_failed' | 'invalid_response' | null
}
