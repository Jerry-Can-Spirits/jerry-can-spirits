import Link from 'next/link'
import Image from 'next/image'
import { PRODUCT_AWARDS } from '@/components/ProductAwards'

// The IWSC result listing for Expedition Spiced Rum. The medals are the one
// claim on the site a stranger can verify in a click, so the whole bar links
// to the source rather than asking to be believed.
const IWSC_RESULT_URL = 'https://www.iwsc.net/results/detail/172185/expedition-spiced-spiced-rum'

/**
 * The proof bar. Sits directly under the hero, whose headline makes the
 * two-medals claim; this states the fact once, in full, with the judges' own
 * words. The homepage says it nowhere else — an award stated once is a fact,
 * stated three times it becomes hype (VOICE), which is why the IWSC entries
 * came out of PressAwards when this went in.
 *
 * Renders from PRODUCT_AWARDS, the same data the product page and its Product
 * schema render from, so the homepage, the product page and the structured
 * data cannot disagree about what was won.
 */
export default function MedalBar() {
  const judgesNote = PRODUCT_AWARDS.find((award) => award.judgesNote)?.judgesNote

  return (
    <section aria-label="IWSC 2026 results" className="bg-jerry-green-900/60 border-y border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 shrink-0">
            {PRODUCT_AWARDS.map((award) => (
              <div key={award.title} className="flex items-center gap-3">
                <Image
                  src={award.image}
                  alt={`${award.title} medal. ${award.citation}`}
                  width={64}
                  height={64}
                  className="shrink-0"
                />
                <div>
                  <p className="text-white font-semibold text-sm">{award.title}</p>
                  <p className="text-parchment-400 text-xs mt-0.5 max-w-[16rem]">{award.citation}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center lg:text-left">
            {judgesNote && (
              <p className="text-parchment-200 italic leading-relaxed">&ldquo;{judgesNote}&rdquo;</p>
            )}
            <p className="text-parchment-500 text-xs mt-2">
              IWSC judging notes.{' '}
              <Link
                href={IWSC_RESULT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-300 hover:text-gold-200 underline underline-offset-2"
              >
                See the results at iwsc.net
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
