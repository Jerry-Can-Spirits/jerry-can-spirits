import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Jerry Can Spirits for enquiries, partnerships, or feedback. Contact our veteran-owned team via email or our online forms.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/",
  },
  openGraph: {
    title: 'Contact Us | Jerry Can Spirits®',
    description: 'Get in touch with Jerry Can Spirits for enquiries, partnerships, or feedback. Contact our veteran-owned team.',
    url: 'https://jerrycanspirits.co.uk/contact/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

// ContactPoint schema for local business SEO
const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://jerrycanspirits.co.uk/#organization',
  name: 'Jerry Can Spirits',
  url: 'https://jerrycanspirits.co.uk',
  logo: 'https://jerrycanspirits.co.uk/images/Logo.webp',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@jerrycanspirits.co.uk',
      availableLanguage: 'English',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'partnerships@jerrycanspirits.co.uk',
      availableLanguage: 'English',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'press',
      email: 'press@jerrycanspirits.co.uk',
      availableLanguage: 'English',
    },
  ],
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={contactSchema} id="contact-schema" />
      {children}
    </>
  )
}