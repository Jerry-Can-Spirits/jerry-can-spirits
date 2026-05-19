import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeSheetSection, TradeSheetShell } from '@/components/trade-portal/TradeSheetShell'

export const dynamic = 'force-dynamic'

const PILOT_START = 'Monday 1 June 2026'
const PILOT_END = 'Sunday 30 August 2026'

export default async function BankBarGrillPilotPage() {
  await requireTradeSession()

  return (
    <TradeSheetShell
      title="The Bank Bar & Grill"
      eyebrow="Pour IQ™ Pilot Charter"
      subtitle={`Pilot window: ${PILOT_START} to ${PILOT_END}`}
    >
      <TradeSheetSection title="Purpose">
        <p className="text-sm leading-relaxed mb-3">
          This document sets out the working arrangement between The Bank Bar & Grill (the Venue) and Jerry Can Spirits (the Brand) for the first Pour IQ™ pilot. It is a working charter, not a contract. Either party can end it at any point with seven days written notice.
        </p>
        <p className="text-sm leading-relaxed">
          The pilot tests whether Pour IQ™ measurably improves how the Venue manages its cocktail menu margin, stock variance, and bartender knowledge. The Brand uses the pilot to validate the platform in real-world use and gather evidence for the next stage of development.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Why The Bank Bar & Grill">
        <p className="text-sm leading-relaxed mb-3">
          Riccardo and the team at The Bank Bar & Grill have backed Jerry Can Spirits from early days. They were the first business to commit to a case purchase, and they have stayed in close communication since. That kind of accommodation matters to a small brand still finding its footing, and we do not take it for granted.
        </p>
        <p className="text-sm leading-relaxed mb-3">
          The Bank is a working cocktail bar with experienced staff, current POS infrastructure, and a willingness to engage critically with a new platform. The right size to generate real signal. The right people to give honest feedback.
        </p>
        <p className="text-sm leading-relaxed">
          We started Pour IQ™ because hospitality margins are tight and the tools available do not always serve the people running the bar. If this platform can change that for The Bank, it changes that for the venues that come after. That is what we are trying to build.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Timeline">
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <span className="font-serif text-white print:text-black">Day 0 (Pilot start).</span> Pour IQ™ access provisioned. The Venue&apos;s existing menu loaded into the platform via AI menu import. Voice Profile configured.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">Days 1-14 (Set-up).</span> Library populated with the Venue&apos;s standing ingredients. Recipes for the existing menu confirmed. Square POS connection live. Initial GP% baseline captured.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">Days 15-45 (Operating, part one).</span> Pour IQ™ used for all cocktail menu and cost decisions. Variance counts entered weekly (or fortnightly if that fits the Venue&apos;s stock cadence better). Invoice scanning used for at least the principal spirits suppliers. Volume entries kept current from Square data.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">Day 45 (Mid-pilot review).</span> 30-minute conversation between the founders and the Venue&apos;s bar manager. What&apos;s working, what&apos;s not, what to adjust. Either party may exit at this point without further notice.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">Days 46-89 (Operating, part two).</span> Continued use with any adjustments from the mid-pilot review applied.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">Day 90 (Wrap).</span> Final review. Quantitative results compiled. Optional testimonial and case study interview if the Venue chooses to participate.
          </p>
        </div>
      </TradeSheetSection>

      <TradeSheetSection title="What we will measure together">
        <p className="text-sm leading-relaxed mb-3">Agreed up front so there is no ambiguity at the end:</p>
        <ul className="text-sm leading-relaxed space-y-2">
          <li>
            <span className="font-serif text-white print:text-black">Cocktail GP% across the menu.</span> Baseline at Day 14, tracked through Day 90.
          </li>
          <li>
            <span className="font-serif text-white print:text-black">Stock variance % on bottle-priced ingredients.</span> Baseline established after the first two weekly counts, tracked monthly thereafter.
          </li>
          <li>
            <span className="font-serif text-white print:text-black">Invoice processing time.</span> Time taken to log a typical supplier delivery, measured at Day 0 (manual) and Day 30 (Pour IQ™ scanning).
          </li>
          <li>
            <span className="font-serif text-white print:text-black">Drink mix.</span> Changes in which cocktails sell most after Pour IQ™ recommendations are applied. Sourced from Square POS data.
          </li>
          <li>
            <span className="font-serif text-white print:text-black">Subjective feedback from the team.</span> Short structured questions at Day 45 and Day 90.
          </li>
        </ul>
        <p className="text-sm leading-relaxed mt-3">Both parties see these numbers in real time through the platform.</p>
      </TradeSheetSection>

      <TradeSheetSection title="What Jerry Can Spirits commits to">
        <p className="text-xs uppercase tracking-widest text-gold-300 print:text-black mb-2">
          For the duration of the pilot
        </p>
        <ul className="text-sm leading-relaxed space-y-2 mb-5">
          <li>Pour IQ™ access provisioned free of charge from Day 0.</li>
          <li>Hands-on set-up support. A founder or designated team member spends the first day on site (or remotely if preferred) loading menus, ingredients, and the Square POS connection.</li>
          <li>A direct line to Dan or Rhys for support and bug reports. Email or phone. Response within one working day; same-day for anything that affects live service.</li>
          <li>Weekly check-ins of no more than 15 minutes unless something specific needs more time. The Venue calls the cadence: weekly, fortnightly, or only-when-needed.</li>
          <li>Real-time response to feature requests and bugs. The Venue&apos;s needs during the pilot directly shape the next development sprint.</li>
        </ul>

        <p className="text-xs uppercase tracking-widest text-gold-300 print:text-black mb-2">
          In recognition of The Bank Bar &amp; Grill&apos;s early commitment to the brand. First to purchase a case, consistent engagement since
        </p>
        <ul className="text-sm leading-relaxed space-y-2 mb-5">
          <li>Pour IQ™ access free for the lifetime of the account, provided The Bank Bar &amp; Grill remains a Jerry Can Spirits customer. This is not a standard offer and will not be repeated for other accounts.</li>
          <li>Partner tier pricing on Expedition Spiced (£178.50 per case, inc VAT, 15% off the standard case) locked for the lifetime of the account.</li>
        </ul>

        <p className="text-xs uppercase tracking-widest text-gold-300 print:text-black mb-2">
          Throughout
        </p>
        <ul className="text-sm leading-relaxed space-y-2">
          <li>Full confidentiality on commercial figures. No specific margin or cost data is shared publicly without the Venue&apos;s written consent.</li>
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="What we ask of The Bank Bar & Grill">
        <ul className="text-sm leading-relaxed space-y-2">
          <li>Use Pour IQ™ for all cocktail menu and cost decisions during the pilot. This is what makes the pilot meaningful. Other categories (food, beer, wine) are out of scope.</li>
          <li>Connect the Square POS account. Sales data flowing into Pour IQ™ is what powers the recommendation engine and the variance baseline.</li>
          <li>Enter weekly stock counts on bottle-priced ingredients. Five minutes per week from the bar manager.</li>
          <li>Use the invoice scanning feature for at least the principal spirits suppliers. This is what proves the cost-change feedback loop.</li>
          <li>One 30-minute mid-pilot conversation at Day 45. Honest review, both directions.</li>
          <li>One 30-minute end-of-pilot conversation at Day 90. Optional testimonial and case study quote if the Venue is willing.</li>
          <li>Permission to acknowledge The Bank Bar &amp; Grill publicly as the Pour IQ™ pilot venue. The Venue retains approval rights over any specific public copy.</li>
          <li>Honest feedback throughout. We can only fix what we know about.</li>
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="What The Bank Bar & Grill gets">
        <ul className="text-sm leading-relaxed space-y-2">
          <li>90 days of Pour IQ™, free.</li>
          <li>Pour IQ™ access free for the lifetime of the account post-pilot, as long as The Bank Bar &amp; Grill remains a Jerry Can Spirits customer.</li>
          <li>Partner tier pricing on Expedition Spiced locked for the lifetime of the account.</li>
          <li>Direct relationship with the founders.</li>
          <li>Influence over the platform roadmap during the pilot and beyond.</li>
          <li>Public credit as the pilot venue, on terms the Venue approves.</li>
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="What Jerry Can Spirits gets">
        <ul className="text-sm leading-relaxed space-y-2">
          <li>Real-world validation of Pour IQ™ across every shipped feature.</li>
          <li>Quantitative evidence to share with future trade conversations.</li>
          <li>A case study (with the Venue&apos;s consent).</li>
          <li>A reference customer.</li>
          <li>Direct signal on what to build next.</li>
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="Exit clauses">
        <ul className="text-sm leading-relaxed space-y-2">
          <li>Either party may end the pilot at any time with seven days written notice.</li>
          <li>Pour IQ™ access remains available to the Venue for the remainder of the 90-day window even if the pilot is paused, so no data is held hostage.</li>
          <li>All commercial figures shared during the pilot remain confidential unless both parties agree in writing to publish.</li>
          <li>If the pilot ends early, post-pilot pricing terms are renegotiated in good faith.</li>
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="Acknowledgement">
        <p className="text-sm leading-relaxed mb-6">
          This charter is acknowledged by both parties as the working basis for the pilot. It is not a binding contract, but it is the standard we hold ourselves to.
        </p>

        <p className="text-xs uppercase tracking-widest text-gold-300 print:text-black mb-3">
          For The Bank Bar &amp; Grill
        </p>
        <div className="space-y-4 mb-6 text-sm">
          <SignatureLine label="Name" />
          <SignatureLine label="Role" />
          <SignatureLine label="Signature" />
          <SignatureLine label="Date" />
        </div>

        <p className="text-xs uppercase tracking-widest text-gold-300 print:text-black mb-3">
          For Jerry Can Spirits
        </p>
        <div className="space-y-4 text-sm">
          <p className="text-parchment-100 print:text-black font-medium">
            Dan Freeman, Co-Founder &amp; Director
          </p>
          <SignatureLine label="Signature" />
          <SignatureLine label="Date" />
          <p className="text-parchment-100 print:text-black font-medium mt-4">
            Rhys Williams, Co-Founder
          </p>
          <SignatureLine label="Signature" />
          <SignatureLine label="Date" />
        </div>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-parchment-400 print:text-black/70 w-20 flex-shrink-0">{label}:</span>
      <span className="flex-1 border-b border-parchment-400 print:border-black/60 h-6" />
    </div>
  )
}
