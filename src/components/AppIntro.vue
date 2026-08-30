<template>
  <section class="intro">
    <h1>payments-toolkit</h1>
    <p class="lede">
      A validation assistant for payment details. Ask in plain English — it
      checks <strong>card numbers</strong> (Luhn checksum and card network) and
      <strong>IBANs</strong> (format, country length, checksum) by running real
      validators, so the verdict isn't a guess.
    </p>
    <p class="hint">
      Pick a sample from the left or a starter question from the right, or type
      your own below.
    </p>
  </section>
</template>

<style scoped>
.intro {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

h1 {
  margin: 0;
}

.lede {
  margin: 0;
  color: #0f172a;
  line-height: 1.5;
}

.hint {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}
</style>
