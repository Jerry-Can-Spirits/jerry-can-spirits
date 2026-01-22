import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Media & Press",
  description: "Media enquiries and press resources for Jerry Can Spirits. Download press kits, brand assets, and connect with our communications team.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/media/",
  },
}

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
