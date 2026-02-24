'use client'

import { useEffect, useState } from 'react'

interface SocialStats {
  facebook: number | null
  instagram: number | null
}

interface SocialChannel {
  name: string
  handle: string
  url: string
  icon: React.ReactNode
  followers: number | null
  comingSoon?: boolean
}

export default function SocialPresence() {
  const [stats, setStats] = useState<SocialStats>({
    facebook: null,
    instagram: null,
  })

  useEffect(() => {
    fetch('/api/social-stats/')
      .then((res) => res.json())
      .then((data) => setStats(data as SocialStats))
      .catch(() => {
        // Silently fail — cards will show "Follow us"
      })
  }, [])

  const channels: SocialChannel[] = [
    {
      name: 'Facebook',
      handle: '@jerrycanspirits',
      url: 'https://www.facebook.com/jerrycanspirits',
      followers: stats.facebook,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      handle: '@jerrycanspirits',
      url: 'https://www.instagram.com/jerrycanspirits',
      followers: stats.instagram,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      handle: '@jerrycanspirits',
      url: 'https://www.youtube.com/channel/UCIbIsW8KYA-vuRLMfJLq_ag',
      followers: null,
      comingSoon: true,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      handle: '@jerrycanspirits',
      url: 'https://www.tiktok.com/@jerrycanspirits',
      followers: null,
      comingSoon: true,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
    {
      name: 'X',
      handle: '@jerrycanspirits',
      url: 'https://x.com/jerrycanspirits',
      followers: null,
      comingSoon: true,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Bluesky',
      handle: '@jerrycanspirits',
      url: 'https://bsky.app/profile/jerrycanspirits.bsky.social',
      followers: null,
      comingSoon: true,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.625 3.501 6.272 3.061-.534.071-3.58.504-3.58 3.161 0 4.158 5.639 4.531 7.386 1.586.242-.41.354-.652.382-.706.015.029.076.158.178.358.12.24.324.57.616.826 1.118 1.085 3.1 1.502 4.756.608 1.704-.92 2.366-2.662 2.366-4.672 0-2.657-3.046-3.09-3.58-3.161 2.647.44 5.487-.434 6.272-3.061C22.622 9.418 23 4.458 23 3.768c0-.69-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C15.046 4.748 12.087 8.687 12 10.8z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <a
          key={channel.name}
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-5 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 text-center group"
        >
          <div className="text-parchment-200 group-hover:text-gold-300 transition-colors mb-3 flex justify-center">
            {channel.icon}
          </div>
          <h4 className="text-parchment-50 font-semibold text-sm mb-1">
            {channel.name}
          </h4>
          {channel.comingSoon ? (
            <p className="text-parchment-400 text-xs">Coming Soon</p>
          ) : channel.followers ? (
            <p className="text-gold-300 text-sm font-medium">
              {channel.followers.toLocaleString()} followers
            </p>
          ) : (
            <p className="text-parchment-300 text-xs">Follow us</p>
          )}
          <p className="text-parchment-400 text-xs mt-1">{channel.handle}</p>
        </a>
      ))}
    </div>
  )
}
