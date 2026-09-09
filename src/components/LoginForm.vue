<script setup lang="ts">
import { ref } from 'vue'
import { CircleAlert } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'

const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const busy = ref(false)
const errorMessage = ref('')

async function submit() {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  const { error } = await signIn(email.value.trim(), password.value)
  busy.value = false
  if (error) {
    // Supabase answers bad email and bad password identically ("Invalid login
    // credentials") — no user enumeration. Surface the message as-is.
    errorMessage.value = error.message
    password.value = ''
  }
}
</script>

<template>
  <div class="grid min-h-dvh place-items-center p-6">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Payments Toolkit</CardTitle>
        <CardDescription>Sign in to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="username"
              required
              autofocus
              :disabled="busy"
            />
          </div>
          <div class="grid gap-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              :disabled="busy"
            />
          </div>

          <Alert v-if="errorMessage" variant="destructive" class="py-2.5">
            <CircleAlert />
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <Button type="submit" class="w-full" :disabled="busy">
            {{ busy ? 'Signing in…' : 'Sign in' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
