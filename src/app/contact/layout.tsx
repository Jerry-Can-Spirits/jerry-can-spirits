import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact Us | Jerry Can Spirits - Get in Touch",
  description: "Get in touch with Jerry Can Spirits for inquiries, partnerships, or just to say hello. Contact us via email or our contact form.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}