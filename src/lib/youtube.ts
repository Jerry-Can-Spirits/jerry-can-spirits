// One parser for every YouTube URL shape an editor might paste into Sanity
// (youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID). The video id is the only
// thing the site needs: the thumbnail and the player URL both derive from it,
// so the visible embed and the Recipe schema's VideoObject are built from the
// same value and cannot disagree.

export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

/** Thumbnail served by YouTube's image CDN — no player, no cookies. */
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** Privacy-enhanced player URL: no cookies until the visitor plays. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}
