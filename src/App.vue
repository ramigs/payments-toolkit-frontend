<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import AppIntro from './components/AppIntro.vue'
import ChatInput from './components/ChatInput.vue'
import LoginForm from './components/LoginForm.vue'
import MessageList from './components/MessageList.vue'
import SampleCards from './components/SampleCards.vue'
import SampleIbans from './components/SampleIbans.vue'
import SamplePrompts from './components/SamplePrompts.vue'
import { CircleAlert } from '@lucide/vue'
import { Alert, AlertDescription } from './components/ui/alert'
import { Button } from './components/ui/button'
import { ScrollArea } from './components/ui/scroll-area'
import { Separator } from './components/ui/separator'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { useAgentChat } from './composables/useAgentChat'
import { useAuth } from './composables/useAuth'
import { useAutoScroll } from './composables/useAutoScroll'

const { session, user, initializing, signOut } = useAuth()

const { messages, error, isLoading, sendMessage, cancel } = useAgentChat()

const messagesArea = useTemplateRef<InstanceType<typeof ScrollArea>>('messagesArea')
const { isPinned, scrollToBottom } = useAutoScroll(messagesArea)

// Intro state: composer sits vertically centred until the first turn, then
// slides down to dock at the bottom (see `.chat--intro` in the styles).
const hasStarted = ref(false)

function handleSend(message: string) {
  hasStarted.value = true
  sendMessage(message)
  // The user just spoke — always follow, even if they'd scrolled up.
  scrollToBottom()
}

// The chat draft lives here so the sample rails can feed it. Clicking a
// sample appends its value, space-separated, to whatever's already typed.
const draft = ref('')
const chatInput = useTemplateRef<InstanceType<typeof ChatInput>>('chatInput')

function appendToDraft(value: string) {
  const current = draft.value.trimEnd()
  draft.value = current ? `${current} ${value}` : value
  chatInput.value?.focus()
}

// A cancel that reaches the client as an AG-UI event (rather than a local
// stop()) surfaces as an error with message "cancelled" — see
// payments-toolkit-agent's AgUiTranslator. That's a user action, not a
// failure, so acknowledge it with a toast instead of the red error Alert.
const wasCancelled = computed(() => error.value?.message === 'cancelled')

watch(wasCancelled, (cancelled) => {
  if (cancelled) toast('Turn stopped.')
})
</script>

<template>
  <TooltipProvider>
    <!-- Access gate: hold the decision until the stored session is resolved,
       then show the login screen or the app. -->
    <LoginForm v-if="!initializing && !session" />

    <div v-else-if="session" class="layout">
      <!-- Fixed, full-height rails. The center column stays in normal flow so
         it keeps growing the page as the conversation gets longer. -->
      <aside class="rail rail-left">
        <ScrollArea class="rail-scroll">
          <div class="rail-content">
            <SampleCards @pick="appendToDraft" />
            <Separator />
            <SampleIbans @pick="appendToDraft" />
          </div>
        </ScrollArea>
      </aside>

      <main class="chat" :class="{ 'chat--intro': !hasStarted }">
        <AppIntro />
        <div class="messages">
          <ScrollArea ref="messagesArea" class="messages-scroll">
            <MessageList :messages :loading="isLoading" />
          </ScrollArea>
          <button
            v-if="!isPinned"
            type="button"
            class="jump"
            aria-label="Scroll to latest"
            @click="scrollToBottom('smooth')"
          >
            ↓
          </button>
        </div>
        <div class="composer">
          <Alert v-if="error && !wasCancelled" variant="destructive" class="py-2.5">
            <CircleAlert />
            <AlertDescription>{{ error.message }}</AlertDescription>
          </Alert>
          <ChatInput
            ref="chatInput"
            v-model="draft"
            :busy="isLoading"
            @send="handleSend"
            @stop="cancel"
          />
          <Transition
            enter-active-class="transition-opacity duration-300 delay-[450ms] ease-out"
            enter-from-class="opacity-0"
          >
            <p v-if="hasStarted" class="text-muted-foreground ps-3 text-xs">
              Payments Toolkit is AI and can make mistakes. Please double-check responses.
            </p>
          </Transition>
        </div>
        <div class="chat-spacer" aria-hidden="true" />
      </main>

      <aside class="rail rail-right">
        <ScrollArea class="rail-scroll">
          <div class="rail-content">
            <div class="account">
              <span class="account-email">{{ user?.email }}</span>
              <Button variant="ghost" size="sm" @click="signOut">Sign out</Button>
            </div>
            <Separator />
            <SamplePrompts @ask="handleSend" />
          </div>
        </ScrollArea>
      </aside>
    </div>
    <Toaster />
  </TooltipProvider>
</template>

<style>
body {
  margin: 0;
}
</style>

<style scoped>
.layout {
  --rail-width: 280px;
  /* Reserve the gutters the fixed rails sit in. */
  padding: 0 var(--rail-width);
}

.rail {
  position: fixed;
  top: 0;
  height: 100vh;
  width: var(--rail-width);
  box-sizing: border-box;
  background: #f8fafc;
}

.rail-left {
  left: 0;
  border-right: 1px solid #e2e8f0;
}

.rail-right {
  right: 0;
  border-left: 1px solid #e2e8f0;
}

.rail-scroll {
  height: 100%;
}

.rail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 1rem;
}

.account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.account-email {
  overflow: hidden;
  font-size: 0.8125rem;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Full-height column: intro pinned at the top, composer at the bottom, and
   the message list scrolls in the space between. */
.chat {
  max-width: 720px;
  height: 100dvh;
  margin: 0 auto;
  padding: 1.5rem 1rem 5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: padding-bottom 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Intro state: drop the extra bottom padding so the empty message area and the
   spacer share the column below the intro. */
.chat--intro {
  padding-bottom: 1.5rem;
}

.messages {
  position: relative;
  flex: 1 1 0;
  /* Let the flex item shrink below its content so the ScrollArea scrolls. */
  min-height: 0;
}

/* Extra breathing room between the intro and the first message, once the
   conversation has started. (Skipped in the intro state, where the message
   area is empty and the gap would just push the centred composer down.) */
.chat:not(.chat--intro) .messages {
  margin-top: 2.75rem;
}

/* Before the first turn the (empty) message area and this spacer take the slack
   above and below the composer. The spacer grows faster than the message area
   (4 vs 1), so the composer settles above centre, a comfortable gap below the
   intro, instead of being centred. Sending flips the class; the spacer's
   flex-grow transitions to 0 and the message area soaks up the freed space,
   sliding the composer down to dock. The intro stays put throughout. */
.chat-spacer {
  flex: 0 1 0;
  transition: flex-grow 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat--intro .chat-spacer {
  flex-grow: 4;
}

@media (prefers-reduced-motion: reduce) {
  .chat,
  .chat-spacer {
    transition: none;
  }
}

.messages-scroll {
  height: 100%;
}

.jump {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.12);
  cursor: pointer;
}

.jump:hover {
  background: #f8fafc;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Not enough room for 720px of chat between two 280px rails — drop the rails
   back into flow and let the page scroll normally. */
@media (max-width: 1280px) {
  .layout {
    padding: 0;
  }

  .rail {
    position: static;
    height: auto;
    width: auto;
  }

  .chat {
    height: auto;
    min-height: 100dvh;
  }

  .messages {
    min-height: 0;
  }
}
</style>
