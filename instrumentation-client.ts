import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432",

  tracesSampleRate: 0.2,

  debug: false,

  ignoreErrors: [
    // Browser extension errors
    '__firefox__',
    'window.ethereum',
    'ethereum.selectedAddress',
    /MetaMask/i,
    /ethereum/i,
    /reader is undefined/i,
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
  ],

  beforeSend(event) {
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        const stack = exception.stacktrace?.frames || [];

        // Browser extension errors
        const isExtensionError = stack.some(frame =>
          frame.filename?.includes('chrome-extension://') ||
          frame.filename?.includes('moz-extension://') ||
          frame.filename?.includes('safari-extension://') ||
          frame.filename?.includes('webkit-masked-url://')
        );
        if (isExtensionError) return null;

        if (exception.value?.includes('__firefox__')) return null;
        if (exception.value?.includes('ethereum')) return null;

        // Cookiebot auto-blocking mode (uc.js) intercepts event listeners and
        // replays them after consent. When a listener accesses an iframe that has
        // since been removed from the DOM, contentWindow becomes null. This is a
        // known third-party interaction with no user-visible impact.
        const isCookiebotIframeError =
          (exception.value?.includes('contentWindow') ||
           exception.value?.includes("null is not an object")) &&
          stack.some(frame => frame.filename?.includes('uc.js'));
        if (isCookiebotIframeError) return null;
      }
    }

    // Scrub PII and secrets from event messages and exception values.
    // Mirrors the server-side scrub in sentry.server.config.ts so client-side
    // captures (form input typos, validation errors, fetch failures) cannot
    // leak emails or auth tokens to Sentry.
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
