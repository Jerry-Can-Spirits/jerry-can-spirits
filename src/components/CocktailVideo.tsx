'use client'

import { useState } from 'react'
import Image from 'next/image'
import { youtubeId, youtubeThumbnail, youtubeEmbedUrl } from '@/lib/youtube'

/**
 * Click-to-play video for a cocktail page.
 *
 * The videoUrl field used to feed only the Recipe schema's VideoObject and
 * render nothing, which was wrong twice over: a visitor could not watch the
 * video the page told machines about, and schema for invisible content is
 * the mixed signal this codebase keeps removing elsewhere.
 *
 * Until clicked, the page shows only the YouTube thumbnail image (their image
 * CDN, no cookies, no player script). The click swaps in an iframe from
 * youtube-nocookie.com, so nobody is tracked for merely reading a recipe —
 * the same posture as every other third-party surface on this site.
 */
export default function CocktailVideo({ url, name }: { url: string; name: string }) {
  const [playing, setPlaying] = useState(false)
  const id = youtubeId(url)

  // An unparseable URL renders nothing rather than a broken player. The
  // schema side makes the same check, so page and markup stay in step.
  if (!id) return null

  return (
    <div className="mt-6 sm:mt-8 bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gold-500/20">
      <h3 className="text-xl font-serif font-bold text-gold-300 mb-4">Watch it made</h3>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-jerry-green-900">
        {playing ? (
          <iframe
            src={`${youtubeEmbedUrl(id)}?autoplay=1`}
            title={`How to make ${name}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: how to make ${name}`}
            className="group absolute inset-0 h-full w-full"
          >
            <Image
              src={youtubeThumbnail(id)}
              alt={`How to make ${name} — video`}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-jerry-green-900 shadow-xl transition-transform group-hover:scale-110">
              <svg className="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <p className="mt-3 text-parchment-500 text-xs">
        Plays from YouTube&apos;s privacy-enhanced player. Nothing loads until you press play.
      </p>
    </div>
  )
}
