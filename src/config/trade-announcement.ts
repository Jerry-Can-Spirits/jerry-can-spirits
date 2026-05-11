// Hardcoded trade hub announcement banner.
// Set to null to hide the banner; replace contents to show new copy.
// Changing this file requires a one-file PR — appropriate cadence for a
// rarely-changing banner. Graduate to Sanity if the cadence ever justifies it.

export interface TradeAnnouncement {
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
}

export const TRADE_ANNOUNCEMENT: TradeAnnouncement | null = null
