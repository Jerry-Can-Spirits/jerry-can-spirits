import type { PortableTextBlock } from 'next-sanity'
import { blockPlainText } from '@/lib/sanity-text'

// An FAQ as the four Field Manual document types store it. `answerRich` is
// optional portable text with inline links; when present it is what the page
// shows and what the FAQPage structured data carries, and `answer` is only
// the plain copy, the way guide sections keep `content` beside `contentRich`.
export interface SanityFaq {
  question: string
  answer: string
  answerRich?: PortableTextBlock[]
}

/** The answer as plain text for FAQPage structured data, which takes no markup. */
export function faqAnswerText(faq: SanityFaq): string {
  if (!faq.answerRich?.length) return faq.answer
  return faq.answerRich
    .filter((block) => block._type === 'block')
    .map((block) => blockPlainText(block as { children?: { text?: string }[] }))
    .join('\n\n')
}
