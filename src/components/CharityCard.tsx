import Image from 'next/image'
import type { Charity } from '@/lib/d1'

interface CharityCardProps {
  charity: Charity
}

export default function CharityCard({ charity }: CharityCardProps) {
  return (
    <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
      {charity.logo_url && (
        <div className="relative h-20 w-full mb-4">
          <Image
            src={charity.logo_url}
            alt={charity.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      <p className="text-white font-semibold text-lg">{charity.name}</p>
      <p className="text-parchment-300 text-sm leading-relaxed mt-2">{charity.description}</p>
      {charity.website_url && (
        <a
          href={charity.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-gold-400 text-sm hover:text-gold-300 transition-colors"
        >
          Donate directly
        </a>
      )}
    </div>
  )
}
