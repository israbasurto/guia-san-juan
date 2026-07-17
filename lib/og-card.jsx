// Tarjeta OG compartida (next/og / satori). Cada div con varios hijos lleva
// display:flex explícito (requisito de satori). Colores fijos (sin CSS vars).
export function ogCard({ tag, titulo }) {
  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0e1f38', padding: '72px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 58, height: 58, borderRadius: 15, background: '#e6b24a', color: '#0e1f38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700 }}>G</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#ffffff', fontSize: 27, fontWeight: 700 }}>Guía San Juan</span>
          <span style={{ color: '#8aa0bd', fontSize: 16, letterSpacing: 2 }}>SAN JUAN DEL RÍO</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: '#e6b24a', fontSize: 22, fontWeight: 600, letterSpacing: 3, marginBottom: 14 }}>{tag.toUpperCase()}</span>
        <span style={{ color: '#ffffff', fontSize: 62, fontWeight: 700, lineHeight: 1.12 }}>{titulo}</span>
      </div>

      <span style={{ color: '#8aa0bd', fontSize: 20 }}>Trámites · dependencias · directorio — Querétaro</span>
    </div>
  );
}
