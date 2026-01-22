import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Complaints",
  description: "Submit a complaint or provide feedback to Jerry Can Spirits. We take all customer concerns seriously and aim to resolve issues promptly.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/complaints/",
  },
}

export default function ComplaintsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
