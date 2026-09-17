<script setup lang="ts">
import { ref } from 'vue'
import SampleCards from './SampleCards.vue'
import SampleIbans from './SampleIbans.vue'
import SamplePrompts from './SamplePrompts.vue'
import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { CreditCard, Landmark, Lightbulb, LogOut } from '@lucide/vue'

defineProps<{
  userEmail?: string | null
}>()

const emit = defineEmits<{
  // Forwarded straight to App.vue's setDraft/handleSend/signOut — this
  // component only owns which sheet is open.
  pick: [value: string]
  ask: [prompt: string]
  signOut: []
}>()

// One flag per sheet so picking an item can close just that sheet before the
// event reaches App.vue, revealing the composer underneath.
const cardsOpen = ref(false)
const ibansOpen = ref(false)
const promptsOpen = ref(false)
const accountOpen = ref(false)

function pick(value: string) {
  cardsOpen.value = false
  ibansOpen.value = false
  emit('pick', value)
}

function ask(prompt: string) {
  promptsOpen.value = false
  emit('ask', prompt)
}

function signOut() {
  accountOpen.value = false
  emit('signOut')
}
</script>

<template>
  <header class="mobile-header">
    <div class="mobile-header-group">
      <Sheet v-model:open="cardsOpen">
        <Tooltip>
          <TooltipTrigger as-child>
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon-sm" aria-label="Sample cards">
                <CreditCard />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Sample cards</TooltipContent>
        </Tooltip>
        <SheetContent side="bottom" class="max-h-[75vh] overflow-y-auto p-4">
          <SheetHeader class="sr-only">
            <SheetTitle>Sample cards</SheetTitle>
            <SheetDescription>Pick a sample card number to fill the chat draft.</SheetDescription>
          </SheetHeader>
          <SampleCards @pick="pick" />
        </SheetContent>
      </Sheet>

      <Sheet v-model:open="ibansOpen">
        <Tooltip>
          <TooltipTrigger as-child>
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon-sm" aria-label="Sample IBANs">
                <Landmark />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Sample IBANs</TooltipContent>
        </Tooltip>
        <SheetContent side="bottom" class="max-h-[75vh] overflow-y-auto p-4">
          <SheetHeader class="sr-only">
            <SheetTitle>Sample IBANs</SheetTitle>
            <SheetDescription>Pick a sample IBAN to fill the chat draft.</SheetDescription>
          </SheetHeader>
          <SampleIbans @pick="pick" />
        </SheetContent>
      </Sheet>

      <Sheet v-model:open="promptsOpen">
        <Tooltip>
          <TooltipTrigger as-child>
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon-sm" aria-label="Try one">
                <Lightbulb />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Try one</TooltipContent>
        </Tooltip>
        <SheetContent side="bottom" class="max-h-[75vh] overflow-y-auto p-4">
          <SheetHeader class="sr-only">
            <SheetTitle>Try one</SheetTitle>
            <SheetDescription>Pick a starter question to ask.</SheetDescription>
          </SheetHeader>
          <SamplePrompts @ask="ask" />
        </SheetContent>
      </Sheet>
    </div>

    <Sheet v-model:open="accountOpen">
      <Tooltip>
        <TooltipTrigger as-child>
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon-sm" aria-label="Account">
              <LogOut />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Account</TooltipContent>
      </Tooltip>
      <SheetContent side="bottom" class="p-4 pt-0">
        <SheetHeader class="px-0">
          <SheetTitle>Account</SheetTitle>
          <SheetDescription>{{ userEmail }}</SheetDescription>
        </SheetHeader>
        <Button variant="outline" @click="signOut">Sign out</Button>
      </SheetContent>
    </Sheet>
  </header>
</template>

<style scoped>
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-header-group {
  display: flex;
  gap: 0.25rem;
}
</style>
