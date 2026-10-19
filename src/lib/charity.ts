const IMAGE_BASE = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

export const CHARITY_NAME = 'Combat Stress'
export const CHARITY_WEBSITE = 'https://combatstress.org.uk/'
export const CHARITY_NUMBER_EW = '206002'
export const CHARITY_NUMBER_SCOT = 'SC038828'

export const CHARITY_STATEMENT_SHORT = '5% of profits to Combat Stress'
export const CHARITY_STATEMENT_SENTENCE =
  "5% of our profits go to Combat Stress, the veterans' mental health charity"
export const CHARITY_STATEMENT_FULL = `5% of our profits go to Combat Stress, a registered charity in England and Wales (${CHARITY_NUMBER_EW}) and Scotland (${CHARITY_NUMBER_SCOT}).`

export const CHARITY_DESCRIPTION =
  "Combat Stress describes itself as \"the UK's leading charity for veterans' mental health\"."

export const CHARITY_LOGO_ALT = 'In support of Combat Stress'

export const CHARITY_LOGO = {
  primaryLight: `${IMAGE_BASE}/c41b6201-9ff7-4c05-9caa-2b3cd2f15700/public`,
  primaryDark: `${IMAGE_BASE}/0c17b77a-595d-4bfe-2a48-833d2fcb6800/public`,
  wideLight: `${IMAGE_BASE}/c6321585-3809-4eb1-c38c-5200ee9d0f00/public`,
  wideDark: `${IMAGE_BASE}/eef8f3a1-764c-40f9-0872-9e2ad4564600/public`,
} as const
