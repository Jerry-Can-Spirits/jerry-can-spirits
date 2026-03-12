import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Make an Enquiry',
  description: 'Send a general enquiry to Jerry Can Spirits. Questions about Expedition Spiced Rum, trade and wholesale, stockists, or upcoming events.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/enquiries/',
  },
  openGraph: {
    title: 'Make an Enquiry | Jerry Can Spirits®',
    description: 'Send a general enquiry to Jerry Can Spirits. Questions about Expedition Spiced Rum, trade and wholesale, stockists, or upcoming events.',
    url: 'https://jerrycanspirits.co.uk/contact/enquiries/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function EnquiriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
