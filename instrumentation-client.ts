import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432",

  // Error reporting ONLY. Performance tracing is disabled: no tracesSampler is
  // set, and the BrowserTracing integration is filtered out of the defaults
  // below, so no traces are ever collected (this project uses Sentry for error
  // reporting only and never looks at traces). This is a RUNTIME trim, not a
  // bundle trim: on Sentry v10 the tracing CODE cannot be tree-shaken out of the
  // client bundle — @sentry/browser barrel-exports browserTracingIntegration and
  // @sentry/core barrel-exports the span/metrics/AI-instrumentation modules from
  // their index, and neither __SENTRY_TRACING__ nor
  // bundleSizeOptimizations.excludeTracing removes them (measured). The real
  // bundle win (~135 KB) would need lazy-loading the SDK — a larger change.
  // The filter is over the defaults (not a hand-listed array) so a default ERROR
  // integration — breadcrumbs, global + browser-api error handlers, linked
  // errors, dedupe, http context — can never be silently dropped; that would
  // regress error capture, which must not happen. Session Replay is untouched
  // (consent-gated + lazily loaded in SentryReplayConsent.tsx).
  integrations: (defaultIntegrations) =>
    defaultIntegrations.filter((integration) => integration.name !== 'BrowserTracing'),

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
