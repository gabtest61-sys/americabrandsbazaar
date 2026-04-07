declare module 'web-push' {
  interface PushSubscription {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }

  interface RequestOptions {
    gcmAPIKey?: string
    vapidDetails?: {
      subject: string
      publicKey: string
      privateKey: string
    }
    TTL?: number
    headers?: Record<string, string>
    contentEncoding?: string
    proxy?: string
    agent?: unknown
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>

  export { PushSubscription, RequestOptions, setVapidDetails, sendNotification }
}
