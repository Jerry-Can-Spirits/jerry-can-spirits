import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Jerry Can Spirits. Questions about our rum, press and media enquiries, or just want to know more. We're here.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/",
  },
  openGraph: {
    title: 'Contact Us | Jerry Can Spirits®',
    description: "Get in touch with Jerry Can Spirits. Questions about our rum, press and media enquiries, or just want to know more. We're here.",
    url: 'https://jerrycanspirits.co.uk/contact/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
}

// ContactPoint schema for local business SEO
const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://jerrycanspirits.co.uk/#organization',
  name: 'Jerry Can Spirits',
  url: 'https://jerrycanspirits.co.uk',
  logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/images-logo-webp/public',
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