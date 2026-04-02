import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: "https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432",

  // Sample 20% of transactions in production to reduce overhead
  tracesSampleRate: 0.2,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay is added consent-conditionally by SentryReplayConsent component

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
    // ResizeObserver errors (common browser noise)
    /ResizeObserver loop/i,
    // Network errors that are not actionable
    /NetworkError/i,
    /Network request failed/i,
  ],

  beforeSend(event) {
    // Filter out errors from browser extensions
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        const stack = exception.stacktrace?.frames || [];

        // Check if error originated from a browser extension
        const isExtensionError = stack.some(frame =>
          frame.filename?.includes('chrome-extension://') ||
          frame.filename?.includes('moz-extension://') ||
          frame.filename?.includes('safari-extension://') ||
          frame.filename?.includes('webkit-masked-url://')
        );

        if (isExtensionError) {
          return null; // Don't send to Sentry
        }

        // Check for Firefox extension variables
        if (exception.value?.includes('__firefox__')) {
          return null;
        }

        // Check for MetaMask/crypto wallet errors
        if (exception.value?.includes('ethereum')) {
          return null;
        }

        // Cookiebot auto-blocking mode (uc.js) intercepts event listeners and
        // replays them after consent. When a listener accesses an iframe that has
        // since been removed from the DOM, contentWindow becomes null. This is a
        // known third-party interaction with no user-visible impact.
        const isCookiebotIframeError =
          (exception.value?.includes('contentWindow') ||
           exception.value?.includes('null is not an object')) &&
          stack.some(frame => frame.filename?.includes('uc.js'));
        if (isCookiebotIframeError) return null;
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
