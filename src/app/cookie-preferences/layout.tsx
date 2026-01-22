import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Cookie Preferences",
  description: "Manage your cookie preferences for Jerry Can Spirits. Control which cookies are used to enhance your browsing experience and protect your privacy.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/cookie-preferences/",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CookiePreferencesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
