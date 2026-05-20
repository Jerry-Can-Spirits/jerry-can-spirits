// Public identifier (not a secret) for the live ratings cron job. Filled in
// once after the operator has looked up the value via the Place ID Finder
// at developers.google.com/maps/documentation/places/web-service/place-id.
// Until the constant is a non-empty string, the Google fetcher
// short-circuits and writes nothing — the /reviews/ page renders as it does
// today.
//
// Derived from https://g.page/r/CdkZacM6VKi-EAE

export const GOOGLE_PLACE_ID = ''
