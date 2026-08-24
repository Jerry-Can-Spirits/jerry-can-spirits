import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Portal Sign In | Jerry Can Spirits',
  description:
    'Sign in to the Jerry Can Spirits trade portal with your venue PIN. Trade pricing, the order form, cocktail cards and bartender resources for licensed venues.',
  // noindex is right: a sign-in form has nothing to rank for. follow was not.
  //
  // This page links to /trade/apply/, and the crawl reports that page holding
  // one dofollow and one nofollow inbound link. The nofollow one is this link,
  // wasted by a directive that was never about it. /trade/apply/ is where a
  // venue starts a trade account and it is among the most link-starved pages on
  // the site, so throwing away one of its two inbound links costs something
  // real and gains nothing: crawl budget saved on a page with a single form and
  // two links is not a saving worth making.
  robots: { index: false, follow: true },
}

export default function TradeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
