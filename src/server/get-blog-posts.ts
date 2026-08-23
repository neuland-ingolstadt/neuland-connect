import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { fetchLatestBlogPosts } from '#/lib/blog/client'
import type { BlogPostsResult } from '#/lib/blog/types'
import { LOGIN_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'

export const getLatestBlogPostsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BlogPostsResult> => {
    const { requireSessionUser } = await import('#/lib/session.server')
    const sessionData = await requireSessionUser()

    if (!sessionData) {
      throw redirect({ to: ROUTES.LOGIN, search: LOGIN_SEARCH_DEFAULTS })
    }

    return fetchLatestBlogPosts()
  },
)
