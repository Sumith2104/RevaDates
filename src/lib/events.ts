// src/lib/events.ts

// This is a simple in-memory way to broadcast events for SSE.
// In a serverless environment like Vercel, this won't work as expected for global broadcasting 
// across different instances. However, for local development and single-instance deployments,
// we'll use a global singleton pattern to ensure the event emitter is persistent.

const globalForEvents = global as unknown as {
  webhookEventEmitter: EventTarget | undefined;
};

export const webhookEventEmitter =
  globalForEvents.webhookEventEmitter ?? new EventTarget();

if (process.env.NODE_ENV !== 'production') globalForEvents.webhookEventEmitter = webhookEventEmitter;
