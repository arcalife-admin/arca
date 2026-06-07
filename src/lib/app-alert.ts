export type AppAlertPayload = {
  message: string
  title: string
}

type Listener = (payload: AppAlertPayload) => void

const listeners = new Set<Listener>()

export function subscribeAppAlert(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function appAlert(
  message: string,
  options?: {
    title?: string
  }
): void {
  listeners.forEach((listener) =>
    listener({
      message,
      title: options?.title ?? 'Atenție',
    })
  )
}
