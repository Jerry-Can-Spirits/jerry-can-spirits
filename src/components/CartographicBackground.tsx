'use client'

import { useEffect, useState } from 'react'

interface Coordinate {
  lat: string
  lng: string
  name: string
  description: string
  x: number
  y: number
}

interface CartographicBackgroundProps {
  opacity?: number
  showCoordinates?: boolean
  showCompass?: boolean
  className?: string
}

export default function CartographicBackground({ 
  opacity = 0.1, 
  showCoordinates = true,
  showCompass = true,
  className = "absolute inset-0"
}: CartographicBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Function to convert lat/lng to x/y coordinates for world map positioning
  const latLngToXY = (lat: number, lng: number) => {
    // Convert to 0-100 range for positioning
    // Longitude: -180 to +180 -> 0 to 100
    const x = ((lng + 180) / 360) * 100;
    
    // Latitude: +90 to -90 -> 0 to 100 (inverted for screen coordinates)
    const y = ((90 - lat) / 180) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // Parse coordinate string to decimal degrees
  const parseCoordinate = (coordStr: string) => {
    const parts = coordStr.match(/(\d+)°(\d+)'([NS]|[EW])/);
    if (!parts) return 0;
    
    let decimal = parseInt(parts[1]) + parseInt(parts[2]) / 60;
    if (parts[3] === 'S' || parts[3] === 'W') {
      decimal = -decimal;
    }
    return decimal;
  };

  // Military deployment and expedition coordinate easter eggs - well-spaced for visibility
  const storyCoordinatesRaw: Array<{lat: string; lng: string; name: string; description: string}> = [
    // UK brand story locations
    { lat: "53°49'N", lng: "3°03'W", name: "", description: "Blackpool Tower" },
    { lat: "52°30'N", lng: "3°18'W", name: "", description: "Newtown Wales" },
    
    // Well-spaced international locations - no overlaps
    { lat: "18°44'N", lng: "70°10'W", name: "", description: "Caribbean" },
    { lat: "50°00'N", lng: "8°00'E", name: "", description: "Germany" },
    { lat: "46°00'N", lng: "2°00'E", name: "", description: "France" },
    { lat: "65°00'N", lng: "15°00'E", name: "", description: "Norway" },
    { lat: "32°00'N", lng: "100°00'W", name: "", description: "Texas" },
    { lat: "37°00'N", lng: "120°00'W", name: "", description: "California" },
    { lat: "34°00'N", lng: "69°00'E", name: "", description: "Afghanistan" },
    { lat: "52°00'S", lng: "59°00'W", name: "", description: "Falkland Islands" },
    { lat: "64°00'N", lng: "22°00'W", name: "", description: "Iceland" },
    { lat: "72°00'N", lng: "25°00'W", name: "", description: "Greenland" },
    { lat: "36°00'N", lng: "78°00'W", name: "", description: "North Carolina" },
    { lat: "25°00'N", lng: "55°00'E", name: "", description: "Dubai" },
    { lat: "35°30'N", lng: "139°30'E", name: "", description: "Tokyo" },
    { lat: "1°00'N", lng: "104°00'E", name: "", description: "Singapore" },
    { lat: "34°00'S", lng: "151°00'E", name: "", description: "Sydney" }
  ];

  // Convert all coordinates to geographically accurate positions
  const storyCoordinates: Coordinate[] = storyCoordinatesRaw.map(coord => {
    const lat = parseCoordinate(coord.lat);
    const lng = parseCoordinate(coord.lng);
    const { x, y } = latLngToXY(lat, lng);
    
    return {
      lat: coord.lat,
      lng: coord.lng,
      name: coord.name,
      description: coord.description,
      x: x,
      y: y
    };
  });

  if (!mounted) return null

  return (
    <div className={className} style={{ opacity }}>
      {/* Contour Lines SVG */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 1200 800" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ 
          // animation: 'cartographic-drift 120s linear infinite'
        }}
      >
        <defs>
          {/* Gradient for contour lines */}
          <linearGradient id="contourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#6b705c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
          </linearGradient>

          {/* Pattern for topographic texture */}
          <pattern id="topoPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#f59e0b" fillOpacity="0.3" />
            <circle cx="10" cy="10" r="0.5" fill="#6b705c" fillOpacity="0.2" />
            <circle cx="30" cy="30" r="0.5" fill="#6b705c" fillOpacity="0.2" />
          </pattern>
        </defs>

        {/* Green background base */}
        <rect width="100%" height="100%" fill="#2a3421" />
        
        {/* Base topographic texture */}
        <rect width="100%" height="100%" fill="url(#topoPattern)" />

        {/* Contour Lines - Elevation curves */}
        <g stroke="url(#contourGradient)" strokeWidth="0.5" fill="none">
          {/* Mountain range contours */}
          <path d="M50,200 Q200,180 350,200 Q500,220 650,200 Q800,180 950,200" />
          <path d="M80,180 Q200,160 320,180 Q480,200 620,180 Q780,160 920,180" />
          <path d="M110,160 Q200,140 290,160 Q460,180 590,160 Q750,140 890,160" />
          
          {/* Valley contours */}
          <path d="M100,400 Q300,420 500,400 Q700,380 900,400" />
          <path d="M120,420 Q300,440 480,420 Q680,400 880,420" />
          <path d="M140,440 Q300,460 460,440 Q660,420 860,440" />

          {/* Coastal contours */}
          <path d="M50,600 Q150,580 250,600 Q400,620 550,600 Q700,580 850,600" />
          <path d="M80,620 Q180,600 280,620 Q430,640 580,620 Q730,600 880,620" />

          {/* Island contours */}
          <ellipse cx="200" cy="500" rx="40" ry="25" />
          <ellipse cx="180" cy="510" rx="25" ry="15" />
          <ellipse cx="700" cy="350" rx="30" ry="20" />
          <ellipse cx="690" cy="340" rx="15" ry="10" />
        </g>

        {/* Grid lines - UTM style */}
        <g stroke="#6b705c" strokeWidth="0.4" strokeOpacity="0.45" fill="none">
          {/* Vertical grid lines */}
          {[...Array(12)].map((_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="800" />
          ))}
          {/* Horizontal grid lines */}
          {[...Array(8)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 100} x2="1200" y2={i * 100} />
          ))}
        </g>

        {/* Compass rose elements */}
        {showCompass && (
          <g transform="translate(100,200)" opacity="0.4">
            <circle cx="0" cy="0" r="30" stroke="#f59e0b" strokeWidth="1" fill="none" />
            <circle cx="0" cy="0" r="15" stroke="#f59e0b" strokeWidth="0.5" fill="none" />
            {/* Compass points */}
            <path d="M0,-25 L3,-15 L0,-10 L-3,-15 Z" fill="#f59e0b" />
            <path d="M0,25 L3,15 L0,10 L-3,15 Z" fill="#6b705c" />
            <path d="M25,0 L15,3 L10,0 L15,-3 Z" fill="#6b705c" />
            <path d="M-25,0 L-15,3 L-10,0 L-15,-3 Z" fill="#6b705c" />
            <text x="0" y="-35" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="bold">N</text>
          </g>
        )}

        {/* Scale bar */}
        <g transform="translate(1000,700)" opacity="0.4">
          <line x1="0" y1="0" x2="100" y2="0" stroke="#f59e0b" strokeWidth="2" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#f59e0b" strokeWidth="1" />
          <line x1="50" y1="-3" x2="50" y2="3" stroke="#f59e0b" strokeWidth="1" />
          <line x1="100" y1="-3" x2="100" y2="3" stroke="#f59e0b" strokeWidth="1" />
          <text x="50" y="-8" textAnchor="middle" fontSize="6" fill="#f59e0b">100km</text>
        </g>

        {/* Coordinate markers - Story locations */}
        {showCoordinates && storyCoordinates.map((coord, index) => (
          <g key={index} transform={`translate(${(coord.x / 100) * 1200},${(coord.y / 100) * 800})`}>
            {/* Coordinate marker */}
            <circle cx="0" cy="0" r="3" fill="#f59e0b" opacity="0.8" />
            <circle cx="0" cy="0" r="6" stroke="#f59e0b" strokeWidth="0.5" fill="none" opacity="0.6" />
            
            {/* Coordinate text - No place names for easter egg effect */}
            <g opacity="0.9">
              <rect x="10" y="-12" width="80" height="20" rx="3" fill="#2a3421" fillOpacity="0.95" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.6" />
              <text x="15" y="-5" fontSize="7" fill="#f59e0b" fontFamily="monospace" fontWeight="bold" stroke="#2a3421" strokeWidth="0.3">
                {coord.lat}
              </text>
              <text x="15" y="3" fontSize="7" fill="#f59e0b" fontFamily="monospace" fontWeight="bold" stroke="#2a3421" strokeWidth="0.3">
                {coord.lng}
              </text>
            </g>
          </g>
        ))}

        {/* Depth soundings (nautical chart style) */}
        <g fontSize="4" fill="#6b705c" opacity="0.3" fontFamily="monospace">
          <text x="150" y="550">24</text>
          <text x="200" y="580">31</text>
          <text x="250" y="560">18</text>
          <text x="300" y="590">42</text>
          <text x="450" y="570">27</text>
          <text x="500" y="600">35</text>
          <text x="650" y="580">29</text>
          <text x="700" y="610">38</text>
        </g>

        {/* Expedition route lines */}
        <g stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" fill="none" opacity="0.4">
          <path d="M200,500 Q400,300 700,350 Q900,400 1000,200" />
          <path d="M100,600 Q300,400 600,450 Q800,500 950,300" />
        </g>

        {/* Elevation markers */}
        <g fontSize="5" fill="#f59e0b" opacity="0.4" fontFamily="monospace">
          <text x="200" y="170">▲ 847m</text>
          <text x="400" y="150">▲ 1,203m</text>
          <text x="700" y="160">▲ 923m</text>
          <text x="300" y="450">▼ -12m</text>
          <text x="600" y="470">▼ -8m</text>
        </g>
      </svg>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes cartographic-drift {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          25% { transform: translate(-20px, -10px) rotate(0.5deg) scale(1.02); }
          50% { transform: translate(-10px, -20px) rotate(-0.3deg) scale(1); }
          75% { transform: translate(-30px, -5px) rotate(0.2deg) scale(1.01); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
      `}</style>
    </div>
  )
}