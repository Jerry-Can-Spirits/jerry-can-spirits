import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "General Enquiries",
  description: "Have a question about Jerry Can Spirits? Get in touch with our team for general enquiries, product information, or customer support.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/enquiries/",
  },
}

export default function EnquiriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
