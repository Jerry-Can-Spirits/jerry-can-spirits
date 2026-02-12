import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: "https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432",

  // Sample 20% of transactions in production to reduce overhead
  tracesSampleRate: 0.2,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

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
      }
    }

    return event;
  },
});
