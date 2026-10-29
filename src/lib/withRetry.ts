// Retries an idempotent operation on transient failure. Only safe for reads —
// retrying a mutation whose response was lost (but which actually succeeded
// server-side) could duplicate its effect.
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 300): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** i))
      }
    }
  }
  throw lastError
}
