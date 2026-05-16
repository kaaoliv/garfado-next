import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'

interface Props {
  params: { id: string }
}

export default async function ListaPublicaPage({ params }: Props) {
  // Buscar lista com itens e perfil do dono
  const { data: lista } = await supabase
    .from('lists')
    .select(`
      id, name, is_public, created_at,
      profiles:user_id(name, username, avatar_url),
      list_items(
        restaurant_id,
        restaurants(id, name, addr, rating, img, rede)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!lista || !lista.is_public) return notFound()

  const owner = lista.profiles as any
  const items = (lista.list_items as any[]) || []
  const restaurants = items.map(i => i.restaurants).filter(Boolean)

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{lista.name} — {owner?.name || 'Garfado'}</title>
        <meta name="description" content={`Lista de restaurantes de ${owner?.name || 'alguém'} no Garfado. ${restaurants.length} lugares.`} />
        <meta property="og:title" content={`${lista.name} — ${owner?.name}`} />
        <meta property="og:description" content={`${restaurants.length} restaurantes selecionados por ${owner?.name}`} />
        <meta property="og:type" content="website" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #f5f5f7; min-height: 100vh; }
          .container { max-width: 480px; margin: 0 auto; padding: 2rem 1rem 4rem; }
          .header { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
          .owner { display: flex; align-items: center; gap: 12px; }
          .avatar { width: 40px; height: 40px; border-radius: 50%; background: #4ade80; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: #0f1117; overflow: hidden; flex-shrink: 0; }
          .avatar img { width: 100%; height: 100%; object-fit: cover; }
          .owner-name { font-size: 14px; font-weight: 600; color: #f5f5f7; }
          .owner-user { font-size: 12px; color: #71717a; }
          .list-title { font-family: Georgia, serif; font-size: 1.75rem; font-weight: 700; line-height: 1.2; }
          .list-meta { font-size: 13px; color: #71717a; }
          .badge { display: inline-flex; align-items: center; gap: 4px; background: #4ade8020; color: #4ade80; border-radius: 99px; padding: 3px 10px; font-size: 11px; font-weight: 500; margin-top: 8px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .card { border-radius: 10px; overflow: hidden; aspect-ratio: 2/3; position: relative; background: #1a1d24; cursor: pointer; text-decoration: none; }
          .card img { width: 100%; height: 100%; object-fit: cover; }
          .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%); }
          .card-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px; }
          .card-name { font-size: 10px; font-weight: 600; color: white; line-height: 1.2; }
          .card-rating { font-size: 9px; color: #FFC72C; margin-top: 2px; }
          .card-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: #1a1d24; }
          .cta { margin-top: 2rem; padding: 1.5rem; background: #1a1d24; border-radius: 16px; text-align: center; border: 1px solid #2a2d35; }
          .cta-title { font-family: Georgia, serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
          .cta-desc { font-size: 13px; color: #71717a; margin-bottom: 1rem; line-height: 1.5; }
          .cta-btn { display: inline-block; background: #4ade80; color: #0f1117; border-radius: 12px; padding: 12px 24px; font-weight: 700; font-size: 14px; text-decoration: none; }
          .empty { text-align: center; padding: 3rem 1rem; color: #71717a; }
        ` }} />
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="owner">
              <div className="avatar">
                {owner?.avatar_url
                  ? <img src={owner.avatar_url} alt={owner.name} />
                  : (owner?.name || 'G').charAt(0).toUpperCase()
                }
              </div>
              <div>
                <div className="owner-name">{owner?.name || 'Garfador'}</div>
                <div className="owner-user">@{owner?.username || '?'}</div>
              </div>
            </div>
            <div>
              <h1 className="list-title">{lista.name}</h1>
              <p className="list-meta">{restaurants.length} {restaurants.length === 1 ? 'restaurante' : 'restaurantes'}</p>
              <div className="badge">🌐 Lista pública</div>
            </div>
          </div>

          {restaurants.length === 0 ? (
            <div className="empty">
              <p>Essa lista ainda não tem restaurantes.</p>
            </div>
          ) : (
            <div className="grid">
              {restaurants.map((r: any) => (
                <div key={r.id} className="card">
                  {r.img
                    ? <img src={r.img} alt={r.name} />
                    : <div className="card-placeholder">🍽</div>
                  }
                  <div className="card-overlay" />
                  <div className="card-info">
                    <div className="card-name">{r.name}</div>
                    {r.rating && <div className="card-rating">★ {r.rating}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cta">
            <div className="cta-title">Garfado 🍴</div>
            <div className="cta-desc">Registre os restaurantes que você foi, avalie e veja o que seus amigos estão comendo.</div>
            <a href="https://garfado-next.vercel.app" className="cta-btn">Baixar grátis</a>
          </div>
        </div>
      </body>
    </html>
  )
}
