export function QRCode() {
  // Generate a simple QR code pattern using SVG
  // This creates a visual representation similar to the reference
  return (
    <div className="w-20 h-20 bg-white p-1 rounded shadow-sm">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* QR Code pattern - simplified visual representation */}
        <rect x="0" y="0" width="100" height="100" fill="white" />

        {/* Corner squares */}
        <rect x="5" y="5" width="25" height="25" fill="#1F2937" />
        <rect x="10" y="10" width="15" height="15" fill="white" />
        <rect x="13" y="13" width="9" height="9" fill="#1F2937" />

        <rect x="70" y="5" width="25" height="25" fill="#1F2937" />
        <rect x="75" y="10" width="15" height="15" fill="white" />
        <rect x="78" y="13" width="9" height="9" fill="#1F2937" />

        <rect x="5" y="70" width="25" height="25" fill="#1F2937" />
        <rect x="10" y="75" width="15" height="15" fill="white" />
        <rect x="13" y="78" width="9" height="9" fill="#1F2937" />

        {/* Data pattern - random-looking squares */}
        <rect x="35" y="5" width="5" height="5" fill="#1F2937" />
        <rect x="45" y="5" width="5" height="5" fill="#1F2937" />
        <rect x="55" y="5" width="5" height="5" fill="#1F2937" />
        <rect x="35" y="15" width="5" height="5" fill="#1F2937" />
        <rect x="50" y="15" width="5" height="5" fill="#1F2937" />
        <rect x="60" y="15" width="5" height="5" fill="#1F2937" />
        <rect x="40" y="25" width="5" height="5" fill="#1F2937" />
        <rect x="55" y="25" width="5" height="5" fill="#1F2937" />

        <rect x="5" y="35" width="5" height="5" fill="#1F2937" />
        <rect x="15" y="35" width="5" height="5" fill="#1F2937" />
        <rect x="25" y="40" width="5" height="5" fill="#1F2937" />
        <rect x="5" y="45" width="5" height="5" fill="#1F2937" />
        <rect x="20" y="50" width="5" height="5" fill="#1F2937" />
        <rect x="5" y="55" width="5" height="5" fill="#1F2937" />
        <rect x="15" y="60" width="5" height="5" fill="#1F2937" />

        <rect x="35" y="35" width="5" height="5" fill="#1F2937" />
        <rect x="45" y="40" width="5" height="5" fill="#1F2937" />
        <rect x="55" y="35" width="5" height="5" fill="#1F2937" />
        <rect x="40" y="50" width="5" height="5" fill="#1F2937" />
        <rect x="50" y="55" width="5" height="5" fill="#1F2937" />
        <rect x="60" y="45" width="5" height="5" fill="#1F2937" />

        <rect x="70" y="35" width="5" height="5" fill="#1F2937" />
        <rect x="80" y="40" width="5" height="5" fill="#1F2937" />
        <rect x="90" y="35" width="5" height="5" fill="#1F2937" />
        <rect x="75" y="50" width="5" height="5" fill="#1F2937" />
        <rect x="85" y="55" width="5" height="5" fill="#1F2937" />
        <rect x="70" y="60" width="5" height="5" fill="#1F2937" />

        <rect x="35" y="70" width="5" height="5" fill="#1F2937" />
        <rect x="45" y="75" width="5" height="5" fill="#1F2937" />
        <rect x="55" y="70" width="5" height="5" fill="#1F2937" />
        <rect x="40" y="85" width="5" height="5" fill="#1F2937" />
        <rect x="50" y="90" width="5" height="5" fill="#1F2937" />
        <rect x="60" y="80" width="5" height="5" fill="#1F2937" />

        <rect x="70" y="70" width="5" height="5" fill="#1F2937" />
        <rect x="80" y="75" width="5" height="5" fill="#1F2937" />
        <rect x="90" y="80" width="5" height="5" fill="#1F2937" />
        <rect x="75" y="85" width="5" height="5" fill="#1F2937" />
        <rect x="85" y="90" width="5" height="5" fill="#1F2937" />
        <rect x="70" y="90" width="5" height="5" fill="#1F2937" />
      </svg>
    </div>
  )
}
