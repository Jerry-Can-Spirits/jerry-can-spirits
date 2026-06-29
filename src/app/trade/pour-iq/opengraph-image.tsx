import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Pour IQ — Margin analysis for cocktail menus'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: 80, justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12, background: '#059669' }} />
        <div style={{ fontSize: 84, fontWeight: 800, color: '#0f172a', letterSpacing: -2 }}>Pour IQ&#x2122;</div>
        <div style={{ fontSize: 40, color: '#334155', marginTop: 16 }}>Margin analysis for cocktail menus.</div>
        <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 40 }}>Built by Jerry Can Spirits</div>
      </div>
    ),
    { ...size },
  )
}
