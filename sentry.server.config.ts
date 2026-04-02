import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432",

  // Sample 20% of transactions in production to reduce overhead
  tracesSampleRate: 0.2,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out browser extension errors that are not from our application
  ignoreErrors: [
    // Browser extension errors
    '__firefox__',
    'window.ethereum',
    'ethereum.selectedAddress',
    // MetaMask and crypto wallet extensions
    /MetaMask/i,
    /ethereum/i,
    // Firefox extension errors
    /reader is undefined/i,
    // Common browser extension patterns
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
  ],

  beforeSend(event) {
    // Filter out errors from browser extensions
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        const stack = exception.stacktrace?.frames || [];

        const isExtensionError = stack.some(frame =>
          frame.filename?.includes('chrome-extension://') ||
          frame.filename?.includes('moz-extension://') ||
          frame.filename?.includes('safari-extension://') ||
          frame.filename?.includes('webkit-masked-url://')
        );
        if (isExtensionError) return null;

        if (exception.value?.includes('__firefox__')) return null;
        if (exception.value?.includes('ethereum')) return null;
      }
    }

    // Scrub PII and secrets from event messages and exception values
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const secretRegex = /(access_token|api_key|secret|token|password|authorization|bearer)[=:\s]+['"]?[a-zA-Z0-9_\-.]+['"]?/gi

    function scrub(s: string): string {
      return s.replace(emailRegex, '[email]').replace(secretRegex, '$1=[redacted]')
    }

    if (event.message) event.message = scrub(event.message)

    if (event.exception?.values) {
      for (const exc of event.exception.values) {
        if (exc.value) exc.value = scrub(exc.value)
      }
    }

    return event;
  },
});
