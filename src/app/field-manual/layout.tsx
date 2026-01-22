import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Field Manual | Jerry Can Spirits®',
    default: 'Field Manual',
  },
  description: "Master the art of cocktail making with Jerry Can Spirits Field Manual. Discover spiced rum cocktails, premium ingredients, and essential barware for the modern explorer.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function FieldManualLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}