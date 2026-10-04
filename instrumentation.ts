import type { Instrumentation } from 'next'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Every uncaught server error, whether in a route handler, a server
// component or a server action, lands here. The Sentry SDK's own capture is
// a no-op on the Worker (src/lib/server-error-capture.ts explains), so this
// posts the event itself.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { captureServerError } = await import('./src/lib/server-error-capture')
  await captureServerError(err, {
    tags: {
      source: 'onRequestError',
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  })
}
