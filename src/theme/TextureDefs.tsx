/**
 * Procedural texture filters, mounted once at the app root.
 * CSS references these by id (url(#grain-warp) etc.).
 */
export function TextureDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        {/* Warps straight grain lines into believable wood */}
        <filter id="grain-warp" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.14" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Paper fibre speckle */}
        <filter id="parchment-fibres" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="12" result="fibres" />
          <feColorMatrix
            in="fibres"
            type="matrix"
            values="0 0 0 0 0.42
                    0 0 0 0 0.31
                    0 0 0 0 0.16
                    0 0 0 0.18 0"
          />
        </filter>

        {/* Rough ink edge for hand-drawn strokes */}
        <filter id="ink-rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Beaten metal for plaques and seals */}
        <filter id="hammered-metal" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="21" result="bump" />
          <feDiffuseLighting in="bump" lightingColor="#ffe9b0" surfaceScale="2.2" result="lit">
            <feDistantLight azimuth="235" elevation="58" />
          </feDiffuseLighting>
          <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>

        {/* Leather pebbling for the roster panel */}
        <filter id="leather-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="5" seed="33" result="bump" />
          <feDiffuseLighting in="bump" lightingColor="#8a6a45" surfaceScale="1.4">
            <feDistantLight azimuth="200" elevation="62" />
          </feDiffuseLighting>
        </filter>

        <radialGradient id="candle-halo">
          <stop offset="0%" stopColor="#ffd68a" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#e0952f" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
