import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Home({ utente }: { utente: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [storie, setStorie] = useState<any[]>([])
  
  const [nomeUtente, setNomeUtente] = useState('Tu')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    // 1. Prendi i dati del profilo
    supabase.from('profili').select('*').eq('id', utente.id).single().then(({ data }) => {
      if (data) {
        setNomeUtente(data.nome || 'Runner')
        setAvatarUrl(data.avatar_url || '')
      }
    })

    // 2. Prendi i post
    caricaPost()

    // 3. Prendi le storie
    supabase.from('profili').select('*').neq('id', utente.id).limit(5).then(({ data }) => {
      if (data) setStorie(data)
    })
  }, [])

  const caricaPost = async () => {
    const { data } = await supabase
      .from('post')
      .select('*, profili(nome, avatar_url), like(utente_id)')
      .order('creato_il', { ascending: false })
    
    if (data) setPosts(data)
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: 'white', minHeight: '100vh', paddingBottom: '70px' }}>
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom sticky-top bg-white">
        <h4 className="fw-bold mb-0">Runner<span style={{ color: '#ff5722' }}>Social.it</span></h4>
        <div className="d-flex gap-3 fs-5">
          <span>🔔</span>
          <span>💬</span>
        </div>
      </div>

      {/* BARRA STORIE */}
      <div className="d-flex gap-3 p-3 overflow-auto border-bottom" style={{ whiteSpace: 'nowrap' }}>
        <div className="text-center" style={{ width: '70px' }}>
          <div className="position-relative d-inline-block">
            <img src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="rounded-circle" style={{ width: '65px', height: '65px', objectFit: 'cover', border: '2px solid #ddd', padding: '2px' }} />
            <span className="position-absolute bottom-0 end-0 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '22px', height: '22px', color: '#ff5722', fontWeight: 'bold', border: '1px solid #ddd' }}>+</span>
          </div>
          <small className="d-block text-truncate mt-1" style={{ fontSize: '11px' }}>La tua storia</small>
        </div>

        {storie.map((s) => (
          <div key={s.id} className="text-center" style={{ width: '70px' }}>
            <div className="rounded-circle p-1" style={{ border: '2px solid #ff5722' }}>
              <img src={s.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="rounded-circle" style={{ width: '58px', height: '58px', objectFit: 'cover' }} />
            </div>
            <small className="d-block text-truncate mt-1" style={{ fontSize: '11px' }}>{s.nome?.split(' ')[0]}</small>
          </div>
        ))}
      </div>

      {/* FEED */}
      <div className="p-3">
        {posts.length === 0 ? (
          <p className="text-center text-muted mt-4">Nessun post ancora. Inizia tu a condividere una corsa!</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="card border-0 border-bottom rounded-0 mb-3 pb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <img src={post.profili?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="rounded-circle" style={{ width: '35px', height: '35px', objectFit: 'cover' }} />
                  <div>
                    <h6 className="mb-0 fw-bold">{post.profili?.nome || 'Runner'}</h6>
                    <small className="text-muted" style={{ fontSize: '11px' }}>Oggi alle {new Date(post.creato_il).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                </div>
                <span className="fs-4 text-muted">...</span>
              </div>

              {post.immagine_url && (
                <img src={post.immagine_url} className="w-100 rounded-3 mb-2" style={{ objectFit: 'cover', maxHeight: '400px' }} />
              )}

              <div className="bg-light p-2 rounded-3 mb-2 d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold fs-6">{post.testo || 'Allenamento completato'}</div>
                  {post.distanza_km && <div className="text-muted small">{post.distanza_km} km • ritmo {post.ritmo}</div>}
                </div>
                <span className="badge bg-white text-dark border">👟 {post.attivita}</span>
              </div>

              <div className="d-flex gap-3 fs-5 mb-2">
                <span style={{ color: '#ff5722' }}>❤️ {post.like?.length || 0}</span>
                <span>💬</span>
                <span className="ms-auto">✈️</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}