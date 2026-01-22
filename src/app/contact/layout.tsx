import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Jerry Can Spirits for enquiries, partnerships, or feedback. Contact our veteran-owned team via email or our online forms.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}