import Image from 'next/image'
import Link from 'next/link'
import { CHARITY_LOGO, CHARITY_LOGO_ALT, CHARITY_WEBSITE } from '@/lib/charity'

// The three accreditations the footer and the homepage already carry, on a
// white plate because the marks are designed for light backgrounds. Same
// assets, same destinations, so the claim on the product page is the claim
// everywhere else, with Combat Stress beside them as the charity behind the 5%.
// The IWSC medals are not here: ProductAwards owns them.
const ITEMS = [
  {
    src: '/images/AFC_POSITIVE_RGB.png',
    alt: 'Armed Forces Covenant signatory',
    href: '/armed-forces-covenant/',
    external: false,
  },
  {
    src: '/images/ERS_Bronze_Banner.webp',
    alt: 'Defence Employer Recognition Scheme Bronze Award',
    href: '/armed-forces-covenant/',
    external: false,
  },
  {
    src: '/images/British-Veteran-Owned-Logo-Standard.png',
    alt: 'British Veteran Owned verified business',
    href: 'https://www.britishveteranowned.co.uk/directory/jerry-can-spirits-ltd',
    external: true,
  },
  {
    src: CHARITY_LOGO.primaryLight,
    alt: CHARITY_LOGO_ALT,
    href: CHARITY_WEBSITE,
    external: true,
  },
]

export default function RecognitionRow() {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Accreditations">
      {ITEMS.map((item) => {
        const img = (
          <Image src={item.src} alt={item.alt} width={150} height={60} className="h-10 w-auto object-contain" loading="lazy" />
        )
        const cls = 'flex h-14 items-center justify-center rounded-lg bg-white px-3 transition-shadow hover:shadow-lg'
        return (
          <li key={item.src}>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={item.alt}>
                {img}
              </a>
            ) : (
              <Link href={item.href} className={cls} aria-label={item.alt}>
                {img}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
