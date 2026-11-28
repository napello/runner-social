import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Home({ utente }: { utente: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [storie, setStorie] = useState<any[]>([])
  const [uscite, setUscite] = useState<any[]>([])
  
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

    // 4. Prendi le uscite di gruppo (per il mockup)
    supabase.from('uscite').select('*, partecipanti(utente_id), profili(nome)').limit(3).then(({ data }) => {
      if (data) setUscite(data)
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
      
            {/* HEADER STILE MOCKUP (PDF) */}
      <div className="p-3 border-bottom bg-white">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h3 className="fw-bold mb-0" style={{ letterSpacing: '-0.5px' }}>
            Runner<span style={{ color: '#ff5722' }}>Social.it</span>
          </h3>
          
          {/* Icone Campanella e Fumetto (SVG) */}
          <div className="d-flex gap-3">
            <button className="btn p-0 border-0" style={{ color: '#1a1a1a' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
            </button>
            <button className="btn p-0 border-0" style={{ color: '#1a1a1a' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.702 21.702 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.677 9.677 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="d-flex align-items-center gap-1 small text-muted fw-semibold">
          <span style={{ color: '#ff5722' }}>📍</span>
          <span>Vicino a te • 5 km</span>
        </div>
      </div>

      {/* BARRA STORIE (STILE MOCKUP) */}
      <div className="d-flex gap-3 p-3 overflow-auto border-bottom" style={{ whiteSpace: 'nowrap' }}>
        {/* La tua storia */}
        <div className="text-center" style={{ width: '75px' }}>
          <div className="position-relative d-inline-block">
            <img 
              src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              className="rounded-circle" 
              style={{ width: '70px', height: '70px', objectFit: 'cover', border: '2px solid #ff5722', padding: '2px' }} 
            />
            <span className="position-absolute bottom-0 end-0 bg-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '24px', height: '24px', color: '#ff5722', fontWeight: 'bold', border: '1px solid #ddd', fontSize: '16px' }}>+</span>
          </div>
          <small className="d-block text-truncate mt-1" style={{ fontSize: '12px', color: '#333' }}>La tua storia</small>
        </div>

        {/* Storie degli amici */}
        {storie.map((s) => (
          <div key={s.id} className="text-center" style={{ width: '75px' }}>
            <div className="rounded-circle p-1" style={{ border: '2px solid #ff5722', display: 'inline-block' }}>
              <img 
                src={s.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                className="rounded-circle" 
                style={{ width: '64px', height: '64px', objectFit: 'cover' }} 
              />
            </div>
            <small className="d-block text-truncate mt-1" style={{ fontSize: '12px', color: '#333' }}>{s.nome?.split(' ')[0]}</small>
          </div>
        ))}
      </div>

      {/* FEED */}
      <div className="p-3">
        
        {/* 1. I POST (stile Strava/Mockup) */}
        {posts.map((post) => (
          <div key={post.id} className="card border-0 border-bottom rounded-0 mb-3 pb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <img src={post.profili?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                <div>
                  <h6 className="mb-0 fw-bold">{post.profili?.nome || 'Runner'}</h6>
                  <small className="text-muted" style={{ fontSize: '11px' }}>Oggi alle {new Date(post.creato_il).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} • 5 km da te</small>
                </div>
              </div>
              <span className="fs-4 text-muted" style={{ cursor: 'pointer' }}>...</span>
            </div>

            {post.immagine_url && (
              <img src={post.immagine_url} className="w-100 rounded-3 mb-2" style={{ objectFit: 'cover', maxHeight: '350px' }} />
            )}

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <div className="fw-bold fs-6">{post.testo || 'Allenamento completato!'}</div>
                {post.distanza_km && <div className="text-muted small">{post.distanza_km} km • ritmo {post.ritmo}</div>}
              </div>
              <span className="badge" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>👟 {post.attivita}</span>
            </div>

            <div className="d-flex gap-3 fs-5 mb-1">
              <span style={{ color: '#ff5722', cursor: 'pointer' }}>❤️ {post.like?.length || 0}</span>
              <span style={{ cursor: 'pointer' }}>💬 5</span>
              <span className="ms-auto" style={{ cursor: 'pointer' }}>✈️</span>
            </div>
          </div>
        ))}

        {/* 2. LE USCITE DI GRUPPO (stile Card Arancione Mockup) */}
        {uscite.map((u) => (
          <div key={u.id} className="card border-0 shadow-sm mb-3 p-3" style={{ borderRadius: '15px' }}>
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '45px', height: '45px', backgroundColor: '#ff5722', color: 'white' }}>
                <span className="fs-4">🏃</span>
              </div>
              <div>
                <h6 className="fw-bold mb-0">{u.titolo} <span className="badge bg-light text-dark border ms-1" style={{ fontSize: '10px' }}>Aperto</span></h6>
              </div>
              <span className="ms-auto fs-4 text-muted">...</span>
            </div>
            
            <div className="small text-muted mb-1">📅 {new Date(u.data_ora).toLocaleString('it-IT', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</div>
            <div className="small text-muted mb-3">📍 {u.punto_ritrovo}</div>
            <div className="small fw-bold mb-2">👥 {u.partecipanti?.length || 0} partecipanti</div>
            
            <button className="btn w-100 fw-bold text-white mb-2" style={{ backgroundColor: '#ff5722', borderRadius: '8px' }}>Partecipa</button>
            
            <div className="bg-light rounded p-2 d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }}>
              <span className="small fw-bold text-dark">💬 Chat dell'evento</span>
              <span className="text-muted">›</span>
            </div>
          </div>
        ))}

        {/* Se non c'è nulla da mostrare */}
        {posts.length === 0 && uscite.length === 0 && (
          <p className="text-center text-muted mt-4">Nessun post o uscita. Inizia tu a condividere qualcosa!</p>
        )}

      </div>
    </div>
  )
}