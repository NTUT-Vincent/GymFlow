import { createBrowserClient } from '@supabase/ssr'

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

// Supabase SSR uses cookies so OAuth PKCE works across client and route handlers.
// createBrowserClient reuses the same browser instance by default.
export function createClient() {
  if (!supabaseConfigured) return null
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
