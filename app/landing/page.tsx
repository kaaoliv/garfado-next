import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Garfado — Registre onde você comeu',
  description: 'Colecione os restaurantes que você foi. Veja o que seus amigos estão garfando. Descubra lugares novos.',
  openGraph: {
    title: 'Garfado — Registre onde você comeu',
    description: 'Seu diário gastronômico. Registre, compartilhe e descubra restaurantes com amigos.',
    images: ['/og-image.png'],
  },
}

export default function LandingPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080b0f; --bg2: #0f1117; --bg3: #161a20;
          --fg: #f0ede6; --fg2: #9a9590; --fg3: #5a5550;
          --green: #4ade80; --border: rgba(255,255,255,0.07);
        }
        body { background: var(--bg); color: var(--fg); font-family: 'DM Sans', sans-serif; font-weight: 300; line-height: 1.6; overflow-x: hidden; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      {/* Injetar fontes e estilos via link no head seria ideal, mas como é client-only usamos inline */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <div style={{ minHeight: '100vh', background: '#080b0f', color: '#f0ede6', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>

        {/* NAV */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', background: 'rgba(8,11,15,0.9)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="20" viewBox="0 0 18 48" fill="none">
              <line x1="9" y1="1" x2="9" y2="28" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="1" x2="4" y2="12" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="14" y1="1" x2="14" y2="12" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 12 Q9 18 14 12" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="9" y1="28" x2="9" y2="47" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="9" cy="38" r="4" fill="#4ade80"/>
            </svg>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>garfado</span>
          </div>
          <a href="https://garfado.com.br" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#4ade80', color: '#080b0f', fontSize: '0.85rem', fontWeight: 500, padding: '0.55rem 1.2rem', borderRadius: '99px', textDecoration: 'none' }}>
            Abrir app →
          </a>
        </nav>

        {/* HERO */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '7rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.35rem 0.9rem', borderRadius: '99px', marginBottom: '2rem' }}>
            <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            Seu diário gastronômico
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '1.5rem', maxWidth: 800 }}>
            Cada refeição<br/>merece ser{' '}
            <em style={{ fontStyle: 'italic', color: '#4ade80' }}>lembrada</em>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: '#9a9590', maxWidth: 460, marginBottom: '3rem', lineHeight: 1.7 }}>
            Registre os restaurantes que você foi, veja o que seus amigos estão garfando e descubra lugares novos.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '5rem' }}>
            <a href="https://garfado.com.br" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#4ade80', color: '#080b0f', fontSize: '1rem', fontWeight: 500, padding: '0.9rem 2rem', borderRadius: '99px', textDecoration: 'none' }}>
              🍴 Começar a garfar
            </a>
            <a href="#como-funciona" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#f0ede6', fontSize: '1rem', padding: '0.9rem 2rem', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
              Como funciona →
            </a>
          </div>

          {/* Mockup */}
          <div style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '2.5rem', padding: '1.25rem 0.75rem', width: 280, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 70, height: 18, background: '#080b0f', borderRadius: 99, margin: '0 auto 1rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', fontWeight: 700 }}>garfado</span>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#080b0f' }}>K</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', marginBottom: '0.75rem' }}>
              {[
                { emoji: '🌿', name: 'Botanikafé', bg: '#1a4020', border: '#2a4a30' },
                { emoji: '🍔', name: "McDonald's", bg: '#3d0a0a', border: '#4a1a1a' },
                { emoji: '🍕', name: 'Bráz Pizza', bg: '#1a2a4a', border: '#1a2a4a' },
                { emoji: '🥖', name: 'Subway', bg: '#2a1a00', border: '#3a2a10' },
                { emoji: '🍺', name: 'Bar do Léo', bg: '#1a1a3a', border: '#2a2a4a' },
                { emoji: '🍗', name: 'KFC', bg: '#1a3a3a', border: '#1a3a3a' },
              ].map((r, i) => (
                <div key={i} style={{ borderRadius: 8, aspectRatio: '3/4', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', background: `linear-gradient(135deg, ${r.bg}, #0f1117)`, border: `1px solid ${r.border}` }}>
                  {r.emoji}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '0.5rem 0.3rem 0.3rem', fontSize: '0.42rem', fontWeight: 600, color: 'white' }}>
                    {r.name}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.75rem' }}>
              {['visitados','hunter','mapa','amigos','perfil'].map((tab, i) => (
                <div key={tab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: '0.4rem', color: i === 0 ? '#4ade80' : '#5a5550' }}>
                  <div style={{ width: 18, height: 3, borderRadius: 99, background: 'currentColor' }} />
                  {tab}
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', maxWidth: 1100, margin: '0 auto' }} />

        {/* FEATURES */}
        <section style={{ padding: '6rem 2rem', maxWidth: 1100, margin: '0 auto' }} id="funcionalidades">
          <p style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '1rem' }}>Funcionalidades</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1rem' }}>Tudo que um<br/>garfador precisa</h2>
          <p style={{ color: '#9a9590', fontSize: '1.05rem', maxWidth: 480, lineHeight: 1.7, marginBottom: '4rem' }}>Simples de usar, poderoso o suficiente para os mais apaixonados por gastronomia.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
            {[
              { icon: '🍴', title: 'Check-in em restaurantes', desc: 'Registre cada visita com um toque. Avalie a comida, atendimento, limpeza e muito mais.' },
              { icon: '👥', title: 'Veja o que amigos garfam', desc: 'Feed em tempo real com as garfadas dos seus amigos. Descubra novos lugares por indicação de quem você confia.' },
              { icon: '🗺️', title: 'Mapa das garfadas', desc: 'Visualize todos os restaurantes que você já visitou em um mapa interativo.' },
              { icon: '🎯', title: 'Hunter de franquias', desc: 'Complete coleções de redes como McDonald\'s, BK e Subway. Quantas unidades você já garfou?' },
              { icon: '📊', title: 'Conquistas e stats', desc: 'Acompanhe seu histórico gastronômico com estatísticas detalhadas e conquistas únicas.' },
              { icon: '🔗', title: 'Perfil público', desc: 'Compartilhe em garfado.com.br/seunome e mostre sua coleção para o mundo.' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#0f1117', padding: '2rem', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#161a20')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0f1117')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: i % 2 === 0 ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.25rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#9a9590', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', maxWidth: 1100, margin: '0 auto' }} />

        {/* COMO FUNCIONA */}
        <section style={{ padding: '6rem 2rem', maxWidth: 1100, margin: '0 auto' }} id="como-funciona">
          <p style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '1rem' }}>Como funciona</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '4rem' }}>Em três passos</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
            {[
              { n: '01', title: 'Crie sua conta', desc: 'Entre com o Google em segundos. Escolha seu username e comece a garfar.' },
              { n: '02', title: 'Registre onde você comeu', desc: 'Busque o restaurante pelo nome, adicione do Google Maps e marque sua visita.' },
              { n: '03', title: 'Siga amigos e explore', desc: 'Descubra onde seus amigos estão comendo e encontre seu próximo restaurante favorito.' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '4rem', fontWeight: 900, color: '#161a20', WebkitTextStroke: '1px rgba(255,255,255,0.07)', lineHeight: 1, marginBottom: '0.75rem' }}>{s.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#9a9590', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', maxWidth: 1100, margin: '0 auto' }} />

        {/* CTA FINAL */}
        <section style={{ padding: '8rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '1.5rem' }}>
            Pronto para começar<br/>a <em style={{ fontStyle: 'italic', color: '#4ade80' }}>garfar</em>?
          </h2>
          <p style={{ color: '#9a9590', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Disponível agora no navegador. Em breve na Play Store.</p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://garfado.com.br" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#161a20', border: '1px solid rgba(255,255,255,0.07)', color: '#f0ede6', padding: '0.85rem 1.5rem', borderRadius: '0.85rem', textDecoration: 'none' }}>
              <span style={{ fontSize: '1.5rem' }}>🌐</span>
              <span style={{ textAlign: 'left' }}>
                <small style={{ display: 'block', fontSize: '0.62rem', color: '#5a5550', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acesse agora</small>
                <strong style={{ fontSize: '0.95rem', fontWeight: 500 }}>garfado.com.br</strong>
              </span>
            </a>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#161a20', border: '1px solid rgba(255,255,255,0.07)', color: '#f0ede6', padding: '0.85rem 1.5rem', borderRadius: '0.85rem', opacity: 0.45 }}>
              <span style={{ fontSize: '1.5rem' }}>▶</span>
              <span style={{ textAlign: 'left' }}>
                <small style={{ display: 'block', fontSize: '0.62rem', color: '#5a5550', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Em breve</small>
                <strong style={{ fontSize: '0.95rem', fontWeight: 500 }}>Google Play</strong>
              </span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', maxWidth: 1100, margin: '0 auto' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700 }}>garfado</span>
          <p style={{ fontSize: '0.8rem', color: '#5a5550' }}>© 2026 Garfado. Feito com 🍴 no Brasil.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/politica-privacidade" style={{ fontSize: '0.8rem', color: '#5a5550', textDecoration: 'none' }}>Privacidade</a>
            <a href="mailto:contato@garfado.com.br" style={{ fontSize: '0.8rem', color: '#5a5550', textDecoration: 'none' }}>Contato</a>
          </div>
        </footer>

      </div>
    </>
  )
}
