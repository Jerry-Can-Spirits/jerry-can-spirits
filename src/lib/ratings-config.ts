// Public identifier (not a secret) for the live ratings cron job. Filled in
// once after the operator has looked up the value via the Place ID Finder
// at developers.google.com/maps/documentation/places/web-service/place-id.
// Until the constant is a non-empty string, the Google fetcher
// short-circuits and writes nothing, and the /reviews/ page renders as it
// does today.
//
// To find the right business in the Place ID Finder, search for the name
// associated with the existing Google Maps shortlink
// https://g.page/r/CdkZacM6VKi-EAE (Jerry Can Spirits Ltd). Copy the
// Place ID from the finder result.

export const GOOGLE_PLACE_ID = ''
