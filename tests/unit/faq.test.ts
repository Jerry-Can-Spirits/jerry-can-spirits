import { describe, it, expect } from 'vitest'
import { faqAnswerText } from '@/lib/faq'

const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: text.slice(0, 4), marks, text })

describe('faqAnswerText', () => {
  it('uses the plain answer when there is no rich one', () => {
    expect(faqAnswerText({ question: 'Q', answer: 'Plain.' })).toBe('Plain.')
  })

  it('falls back to the plain answer when the rich one is empty', () => {
    expect(faqAnswerText({ question: 'Q', answer: 'Plain.', answerRich: [] })).toBe('Plain.')
  })

  it('flattens a rich answer to its text with the link markup dropped', () => {
    const faq = {
      question: 'Q',
      answer: 'Stale plain copy.',
      answerRich: [
        {
          _type: 'block',
          _key: 'b1',
          style: 'normal',
          markDefs: [{ _type: 'internalLink', _key: 'l1', reference: { _type: 'reference', _ref: 'x' } }],
          children: [span('A '), span('spiced rum', ['l1']), span(' sour is easier to balance.')],
        },
        {
          _type: 'block',
          _key: 'b2',
          style: 'normal',
          markDefs: [],
          children: [span('Second paragraph.')],
        },
      ],
    }
    expect(faqAnswerText(faq)).toBe('A spiced rum sour is easier to balance.\n\nSecond paragraph.')
  })
})
