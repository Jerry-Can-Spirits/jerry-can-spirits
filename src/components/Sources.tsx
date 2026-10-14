import { checkedLine, type Source } from '@/lib/sources'

// The foot-of-page source list. Every checkable fact on the page, above all
// about another brand's product or the law, should be one the reader can
// check (Dan, 12 Oct 2026). Renders nothing when there are none.
export default function Sources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null

  return (
    <div id="sources" className="scroll-mt-24">
      <h2 className="text-3xl font-serif font-bold text-white mb-3">Sources.</h2>
      <p className="text-sm text-parchment-400 mb-6">{checkedLine(sources)}</p>
      <ol className="rounded-xl bg-jerry-green-800 border border-gold-500/20 p-6 space-y-3 list-decimal list-outside pl-10 marker:text-gold-400 text-sm text-parchment-300 leading-relaxed">
        {sources.map((source, index) => (
          <li key={index} className="pl-1">
            {source.publisher}, &ldquo;
            <a
              href={source.url}
              target="_blank"
              rel="noopener"
              className="text-gold-300 hover:text-gold-200 underline decoration-dotted underline-offset-2 hover:decoration-solid transition-colors break-words"
            >
              {source.title}
              <svg className="inline-block w-3 h-3 ml-1 align-baseline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            &rdquo;
            {source.note ? ` (${source.note})` : ''}.
          </li>
        ))}
      </ol>
    </div>
  )
}
