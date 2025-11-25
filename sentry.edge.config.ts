import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

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
