export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}

export async function onRequestError(err: Error) {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(err);
}
