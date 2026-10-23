/**
 * Polígono luminoso: cuadrados redondeados huecos, girados y desplazados, con duplicados desenfocados
 * y un único trazo con el espectro solar. Es solo atmósfera: decorativo y sin relleno.
 */
export function PolygonArt({ className = "" }: { className?: string }) {
  const squares = [0, 1, 2, 3, 4];
  return (
    <svg aria-hidden viewBox="0 0 400 400" className={className} fill="none">
      <defs>
        <linearGradient id="spectrum" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="340" y2="0">
          <stop offset="0.15" stopColor="#ffb931" />
          <stop offset="0.3" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#2e73fc" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ffffff" stopOpacity="0.07" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="200" cy="200" r="190" fill="url(#glow)" />
      {squares.map((i) => {
        const t = `translate(${i * 13 - 26} ${-i * 9 + 18}) rotate(${i * 11 - 22} 200 200)`;
        return (
          <g key={i} transform={t}>
            <rect x="105" y="105" width="190" height="190" rx="22" stroke="#fafafa" strokeOpacity="0.4" strokeWidth="6" filter="url(#blur)" />
            <rect x="105" y="105" width="190" height="190" rx="22" stroke={i === 2 ? "url(#spectrum)" : "#fafafa"} strokeOpacity={i === 2 ? 1 : 0.22 + i * 0.12} strokeWidth={i === 2 ? 2 : 1.25} />
          </g>
        );
      })}
    </svg>
  );
}
