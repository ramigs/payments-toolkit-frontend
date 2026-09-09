import { computed, readonly, ref } from 'vue'
import type { AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * App-wide auth state, backed by Supabase.
 *
 * Module-scoped singleton: one `onAuthStateChange` subscription for the whole
 * app, shared by every caller. `session` tracks sign-in, sign-out, silent token
 * refresh, and cross-tab changes. `initializing` is true only until the stored
 * session (if any) has been resolved on load, so the UI can hold the gate
 * decision until it knows.
 */
const session = ref<Session | null>(null)
const initializing = ref(true)

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
  initializing.value = false
})

supabase.auth.onAuthStateChange((_event, next) => {
  session.value = next
})

async function signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/** Current access token, or null. Reads via getSession() so a refreshed token is picked up. */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function useAuth() {
  return {
    session: readonly(session),
    user: computed(() => session.value?.user ?? null),
    initializing: readonly(initializing),
    signIn,
    signOut,
    getAccessToken,
  }
}
