interface CartographicBackgroundProps {
  opacity?: number
  showCoordinates?: boolean
  showCompass?: boolean
  className?: string
}

interface Coordinate {
  lat: string
  lng: string
  x: number
  y: number
}

function latLngToXY(lat: number, lng: number) {
  const x = Math.max(0, Math.min(100, ((lng + 180) / 360) * 100))
  const y = Math.max(0, Math.min(100, ((90 - lat) / 180) * 100))
  return { x, y }
}

function parseCoordinate(coordStr: string) {
  const parts = coordStr.match(/(\d+)°(\d+)'([NS]|[EW])/)
  if (!parts) return 0
  let decimal = parseInt(parts[1]) + parseInt(parts[2]) / 60
  if (parts[3] === 'S' || parts[3] === 'W') decimal = -decimal
  return decimal
}

const storyCoordinates: Coordinate[] = [
  { lat: "53°49'N", lng: "3°03'W" },
  { lat: "52°30'N", lng: "3°18'W" },
  { lat: "18°44'N", lng: "70°10'W" },
  { lat: "50°00'N", lng: "8°00'E" },
  { lat: "46°00'N", lng: "2°00'E" },
  { lat: "65°00'N", lng: "15°00'E" },
  { lat: "32°00'N", lng: "100°00'W" },
  { lat: "37°00'N", lng: "120°00'W" },
  { lat: "34°00'N", lng: "69°00'E" },
  { lat: "52°00'S", lng: "59°00'W" },
  { lat: "64°00'N", lng: "22°00'W" },
  { lat: "72°00'N", lng: "25°00'W" },
  { lat: "36°00'N", lng: "78°00'W" },
  { lat: "25°00'N", lng: "55°00'E" },
  { lat: "35°30'N", lng: "139°30'E" },
  { lat: "1°00'N", lng: "104°00'E" },
  { lat: "34°00'S", lng: "151°00'E" },
].map(({ lat, lng }) => {
  const { x, y } = latLngToXY(parseCoordinate(lat), parseCoordinate(lng))
  return { lat, lng, x, y }
})

// The ground behind every page.
//
// The contours used to be hand-drawn: a dozen Q-curves and a couple of
// ellipses, with a square grid over them and invented spot heights reading
// "1,203m". They read as wallpaper because they were. They are now real
// ground, contoured at 25 metre intervals from SRTM 30m elevation data over
// the Pen y Fan horseshoe, which is where anyone who trained in the Beacons
// walked (public domain, NASA; the generator lives outside the repo).
//
// The artwork is a static file rather than inline paths, so the browser
// caches it once for the whole site and none of it lands in the JS bundle.
// Nothing names the place: it is a pattern, not a claim about where the rum
// is made.
//
// The scale bar went with the old drawing. The background is cropped to
// whatever shape the viewport is, so any distance it claimed was wrong.
export default function CartographicBackground({
  opacity = 0.1,
  showCoordinates = true,
  showCompass = true,
  className = 'absolute inset-0',
}: CartographicBackgroundProps) {
  return (
    <div className={className} style={{ opacity }}>
      <div className="absolute inset-0 bg-[#2a3421]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/topography.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {(showCompass || showCoordinates) && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          role="presentation"
        >
          {showCompass && (
            <g transform="translate(100,200)" opacity="0.4">
              <circle cx="0" cy="0" r="30" stroke="#f59e0b" strokeWidth="1" fill="none" />
              <circle cx="0" cy="0" r="15" stroke="#f59e0b" strokeWidth="0.5" fill="none" />
              <path d="M0,-25 L3,-15 L0,-10 L-3,-15 Z" fill="#f59e0b" />
              <path d="M0,25 L3,15 L0,10 L-3,15 Z" fill="#6b705c" />
              <path d="M25,0 L15,3 L10,0 L15,-3 Z" fill="#6b705c" />
              <path d="M-25,0 L-15,3 L-10,0 L-15,-3 Z" fill="#6b705c" />
              <text x="0" y="-35" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="bold">
                N
              </text>
            </g>
          )}

          {showCoordinates &&
            storyCoordinates.map((coord, index) => (
              <g key={index} transform={`translate(${(coord.x / 100) * 1200},${(coord.y / 100) * 800})`}>
                <circle cx="0" cy="0" r="3" fill="#f59e0b" opacity="0.8" />
                <circle cx="0" cy="0" r="6" stroke="#f59e0b" strokeWidth="0.5" fill="none" opacity="0.6" />
                <g opacity="0.9">
                  <rect
                    x="10"
                    y="-12"
                    width="80"
                    height="20"
                    rx="3"
                    fill="#2a3421"
                    fillOpacity="0.95"
                    stroke="#f59e0b"
                    strokeWidth="0.5"
                    strokeOpacity="0.6"
                  />
                  <text
                    x="15"
                    y="-5"
                    fontSize="7"
                    fill="#f59e0b"
                    fontFamily="monospace"
                    fontWeight="bold"
                    stroke="#2a3421"
                    strokeWidth="0.3"
                  >
                    {coord.lat}
                  </text>
                  <text
                    x="15"
                    y="3"
                    fontSize="7"
                    fill="#f59e0b"
                    fontFamily="monospace"
                    fontWeight="bold"
                    stroke="#2a3421"
                    strokeWidth="0.3"
                  >
                    {coord.lng}
                  </text>
                </g>
              </g>
            ))}
        </svg>
      )}
    </div>
  )
}
