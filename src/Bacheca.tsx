import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Bacheca({ utente, zonaId, onLogout }: { utente: any, zonaId: string, onLogout: () => void }) {
  
  const [uploadingStoria, setUploadingStoria] = useState(false)
  
    // Stati Bacheca
  const [uscite, setUscite] = useState<any[]>([])
  const [titolo, setTitolo] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [dataOra, setDataOra] = useState('')
  const [puntoRitrovo, setPuntoRitrovo] = useState('')
  const [ritmo, setRitmo] = useState('aperto')
  
  // Stati Chat
  const [uscitaSelezionata, setUscitaSelezionata] = useState<any>(null)
  const [messaggi, setMessaggi] = useState<any[]>([])
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  
  // Stati Profilo e Storie
  const [nomeUtente, setNomeUtente] = useState('Runner')
  const [cognome, setCognome] = useState('')
  const [nickname, setNickname] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [livelloProfilo, setLivelloProfilo] = useState('principiante')
  const [ritmoProfilo, setRitmoProfilo] = useState('aperto')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const [mostraProfilo, setMostraProfilo] = useState(false)
  const [runnerZona, setRunnerZona] = useState<any[]>([])
  const [runnerSelezionato, setRunnerSelezionato] = useState<any>(null)

  // Stato Toast
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null)

  useEffect(() => {
    // 1. Carica dati profilo loggato
    supabase.from('profili').select('*').eq('id', utente.id).single().then(({ data }) => {
      if (data) {
        if (data.nome) setNomeUtente(data.nome)
        if (data.cognome) setCognome(data.cognome)
        if (data.nickname) setNickname(data.nickname)
        if (data.data_nascita) setDataNascita(data.data_nascita)
        if (data.livello) setLivelloProfilo(data.livello)
        if (data.fascia_ritmo) setRitmoProfilo(data.fascia_ritmo)
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
      }
    })
    
    // 2. Carica runner della stessa zona (per storie)
    supabase.from('profili').select('*').eq('zona_id', zonaId).then(({ data }) => {
      if (data) setRunnerZona(data)
    })

    // 3. Carica uscite
    caricaUscite()
  }, [zonaId])

  const mostraToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const caricaUscite = async () => {
    if (!zonaId) return
    const { data, error } = await supabase
      .from('uscite')
      .select('*, partecipanti(utente_id)')
      .eq('zona_id', zonaId)
      .order('data_ora', { ascending: true })

    if (!error) setUscite(data || [])
  }

  const creaUscita = async () => {
    if (!titolo || !dataOra) return mostraToast('Titolo e data sono obbligatori', 'error')

    const { error } = await supabase.from('uscite').insert({
      zona_id: zonaId,
      creatore_id: utente.id,
      titolo: titolo,
      descrizione: descrizione,
      data_ora: new Date(dataOra).toISOString(),
      punto_ritrovo: puntoRitrovo,
      ritmo_previsto: ritmo
    })

    if (error) {
      mostraToast('Errore: ' + error.message, 'error')
    } else {
      mostraToast('Uscita pubblicata con successo!')
      setTitolo(''); setDescrizione(''); setDataOra(''); setPuntoRitrovo('')
      caricaUscite()
    }
  }

  const partecipaUscita = async (uscitaId: string) => {
    const { error } = await supabase.from('partecipanti').insert({ uscita_id: uscitaId, utente_id: utente.id })
    if (error) {
      if (error.code === '23505') mostraToast('Sei già iscritto!', 'error')
      else mostraToast('Errore: ' + error.message, 'error')
    } else {
      mostraToast('Iscrizione avvenuta!')
      caricaUscite()
    }
  }

  const apriChat = async (uscita: any) => {
    setUscitaSelezionata(uscita)
    const { data } = await supabase.from('messaggi').select('*, profili(nome)').eq('uscita_id', uscita.id).order('creato_il', { ascending: true })
    if (data) setMessaggi(data)
  }

  const inviaMessaggio = async () => {
    if (!nuovoMessaggio.trim() || !uscitaSelezionata) return
    const { error } = await supabase.from('messaggi').insert({ uscita_id: uscitaSelezionata.id, utente_id: utente.id, testo: nuovoMessaggio })
    if (!error) {
      setNuovoMessaggio('')
      const { data } = await supabase.from('messaggi').select('*, profili(nome)').eq('uscita_id', uscitaSelezionata.id).order('creato_il', { ascending: true })
      if (data) setMessaggi(data)
    }
  }

  // Funzione caricamento foto
  const caricaFoto = async (e: any) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${utente.id}-${Math.random()}.${fileExt}`

      let { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(data.publicUrl)
      mostraToast('Foto caricata! Salva le modifiche.')
    } catch (error: any) {
      mostraToast('Errore caricamento: ' + error.message, 'error')
    } finally {
      setUploading(false)
    }
  }
  // Funzione per caricare una storia
  const caricaStoria = async (e: any) => {
    try {
      setUploadingStoria(true)
      if (!e.target.files || e.target.files.length === 0) return
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `storia-${utente.id}-${Math.random()}.${fileExt}`
      
      // Determina se è foto o video
      const tipo = file.type.startsWith('video') ? 'video' : 'foto'

      // Carica nel bucket 'storie'
      let { error: uploadError } = await supabase.storage.from('storie').upload(fileName, file)
      if (uploadError) throw uploadError

      // Prendi il link pubblico
      const { data } = supabase.storage.from('storie').getPublicUrl(fileName)

      // Salva nel database
      const { error: dbError } = await supabase.from('storie').insert({
        utente_id: utente.id,
        media_url: data.publicUrl,
        tipo: tipo
      })

      if (dbError) throw dbError
      
      mostraToast('Storia pubblicata con successo!')
      
    } catch (error: any) {
      mostraToast('Errore caricamento storia: ' + error.message, 'error')
    } finally {
      setUploadingStoria(false)
    }
  }
  // --- VISTA CHAT ---
  if (uscitaSelezionata) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }}>
        <nav className="navbar navbar-dark shadow-sm mb-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container">
            <button onClick={() => setUscitaSelezionata(null)} className="btn btn-outline-light btn-sm">⬅ Torna alla Bacheca</button>
            <span className="navbar-brand mb-0 h1 fs-6">Chat: {uscitaSelezionata.titolo}</span>
          </div>
        </nav>
        <div className="container" style={{ maxWidth: '700px' }}>
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
            <div style={{ height: '400px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {messaggi.map(m => (
                <div key={m.id} className={`d-flex flex-column mb-3 ${m.utente_id === utente.id ? 'align-items-end' : 'align-items-start'}`}>
                  <span className="small text-muted mb-1">{m.profili?.nome || 'Runner'}</span>
                  <span className="px-3 py-2" style={{ backgroundColor: m.utente_id === utente.id ? '#ff5722' : '#e9ecef', color: m.utente_id === utente.id ? 'white' : 'black', borderRadius: '15px', maxWidth: '75%' }}>{m.testo}</span>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2">
              <input type="text" className="form-control bg-light border-0" placeholder="Scrivi un messaggio..." value={nuovoMessaggio} onChange={e => setNuovoMessaggio(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && inviaMessaggio()} />
              <button onClick={inviaMessaggio} className="btn text-white fw-bold px-4" style={{ backgroundColor: '#ff5722' }}>Invia</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA PROFILO ---
  if (mostraProfilo) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }}>
        <nav className="navbar navbar-dark shadow-sm mb-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container">
            <button onClick={() => setMostraProfilo(false)} className="btn btn-outline-light btn-sm">⬅ Torna alla Bacheca</button>
            <span className="navbar-brand mb-0 h1 fs-6">Modifica Profilo</span>
          </div>
        </nav>
        <div className="container pb-5" style={{ maxWidth: '600px' }}>
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
            <div className="text-center mb-4 position-relative">
              <div className="position-relative d-inline-block">
                <img src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="rounded-circle shadow" style={{ width: '130px', height: '130px', objectFit: 'cover', border: '4px solid white' }} />
                <label htmlFor="file-upload" className="position-absolute bottom-0 end-0 text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '40px', height: '40px', cursor: 'pointer', backgroundColor: '#ff5722', border: '3px solid white', fontSize: '20px' }}>
                  {uploading ? '...' : '+'}
                </label>
                <input id="file-upload" type="file" accept="image/*" onChange={caricaFoto} style={{ display: 'none' }} />
              </div>
              <p className="text-muted small mt-2">Clicca sul + per cambiare foto</p>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-muted">Nome</label>
                <input type="text" className="form-control bg-light border-0" value={nomeUtente} onChange={e => setNomeUtente(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-muted">Cognome</label>
                <input type="text" className="form-control bg-light border-0" value={cognome} onChange={e => setCognome(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-muted">Nickname</label>
                <input type="text" className="form-control bg-light border-0" value={nickname} onChange={e => setNickname(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small text-uppercase text-muted">Data di Nascita</label>
                <input type="date" className="form-control bg-light border-0" value={dataNascita} onChange={e => setDataNascita(e.target.value)} />
              </div>
              <div className="col-md-6 mt-4">
                <label className="form-label fw-bold small text-uppercase text-muted">Livello</label>
                <select className="form-select bg-light border-0" value={livelloProfilo} onChange={e => setLivelloProfilo(e.target.value)}>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzato">Avanzato</option>
                </select>
              </div>
              <div className="col-md-6 mt-4">
                <label className="form-label fw-bold small text-uppercase text-muted">Passo (al km)</label>
                <select className="form-select bg-light border-0" value={ritmoProfilo} onChange={e => setRitmoProfilo(e.target.value)}>
                  <option value="7:00+">Più lento di 7:00</option>
                  <option value="6:30-7:00">6:30 - 7:00</option>
                  <option value="6:00-6:30">6:00 - 6:30</option>
                  <option value="5:30-6:00">5:30 - 6:00</option>
                  <option value="5:00-5:30">5:00 - 5:30</option>
                  <option value="aperto">Aperto a tutti</option>
                </select>
              </div>
            </div>
            <button onClick={async () => {
                const { error } = await supabase.from('profili').update({ nome: nomeUtente, cognome: cognome, nickname: nickname, data_nascita: dataNascita || null, avatar_url: avatarUrl, livello: livelloProfilo, fascia_ritmo: ritmoProfilo }).eq('id', utente.id)
                if (error) mostraToast('Errore: ' + error.message, 'error')
                else { mostraToast('Profilo aggiornato!'); setMostraProfilo(false) }
              }} className="btn text-white fw-bold w-100 mt-4 py-2" style={{ backgroundColor: '#ff5722', borderRadius: '10px' }}>
              Salva Modifiche
            </button>
            <hr className="my-4" />
            <button onClick={onLogout} className="btn btn-outline-danger w-100">Disconnetti</button>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA BACHECA ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* Toast di notifica */}
      {toast && (
        <div className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow text-white fw-bold ${toast.type === 'success' ? 'bg-success' : 'bg-danger'}`} style={{ zIndex: 1050 }}>
          {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar navbar-dark shadow-sm mb-0" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="container">
          <span className="navbar-brand fw-bold mb-0 h1">RunnerSocial</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small fw-semibold d-none d-md-block">Ciao, {nomeUtente}</span>
            <img src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Profilo" onClick={() => setMostraProfilo(true)} style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', border: '2px solid white' }} />
          </div>
        </div>
      </nav>

      {/* BARRA DELLE STORIE */}
      <div className="bg-white shadow-sm py-3 mb-4" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div className="container d-flex gap-3 align-items-start">
          
          {/* Pulsante Aggiungi Storia (+) */}
          <div className="text-center" style={{ cursor: 'pointer', minWidth: '65px' }}>
            <label htmlFor="upload-storia" style={{ cursor: 'pointer', margin: 0, display: 'block' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                backgroundColor: '#f0f0f0', border: '2px dashed #ccc',
                display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto'
              }}>
                <span style={{ fontSize: '24px', color: '#ff5722', fontWeight: 'bold' }}>
                  {uploadingStoria ? '...' : '+'}
                </span>
              </div>
            </label>
            <input id="upload-storia" type="file" accept="image/*,video/*" onChange={caricaStoria} style={{ display: 'none' }} />
            <span className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>La tua storia</span>
          </div>

          {/* Storie degli altri runner */}
          {runnerZona.map((r) => (
            <div key={r.id} className="text-center" style={{ cursor: 'pointer', minWidth: '65px' }} onClick={() => setRunnerSelezionato(r)}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', padding: '3px', background: 'linear-gradient(45deg, #ff5722, #ff9800)', margin: '0 auto' }}>
                <img src={r.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
              </div>
              <span className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>{r.nome?.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD RUNNER SELEZIONATO (Storia cliccata) */}
      {runnerSelezionato && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg p-4 text-center" style={{ width: '300px', borderRadius: '20px' }}>
            <img src={runnerSelezionato.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="rounded-circle mx-auto mb-3" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
            <h4 className="fw-bold">{runnerSelezionato.nome}</h4>
            <p className="text-muted small mb-1">Livello: {runnerSelezionato.livello}</p>
            <p className="text-muted small mb-3">Ritmo: {runnerSelezionato.fascia_ritmo}</p>
            <button className="btn text-white w-100 mb-2" style={{ backgroundColor: '#ff5722' }}>Invita a correre</button>
            <button onClick={() => setRunnerSelezionato(null)} className="btn btn-light w-100">Chiudi</button>
          </div>
        </div>
      )}

      {/* CONTENUTO BACHECA (Modulo + Uscite) */}
      <div className="container pb-5" style={{ maxWidth: '800px' }}>
        
        {/* Modulo Crea Uscita */}
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '15px' }}>
          <h4 className="fw-bold mb-3">Organizza una corsa</h4>
          <div className="row g-3">
            <div className="col-12"><input type="text" className="form-control bg-light border-0" placeholder="Titolo (es. Corsa mattutina)" value={titolo} onChange={e => setTitolo(e.target.value)} /></div>
            <div className="col-12"><textarea className="form-control bg-light border-0" placeholder="Descrizione (opzionale)" value={descrizione} onChange={e => setDescrizione(e.target.value)} rows={2} /></div>
            <div className="col-md-6"><input type="datetime-local" className="form-control bg-light border-0" value={dataOra} onChange={e => setDataOra(e.target.value)} /></div>
            <div className="col-md-6"><input type="text" className="form-control bg-light border-0" placeholder="Punto di ritrovo" value={puntoRitrovo} onChange={e => setPuntoRitrovo(e.target.value)} /></div>
            <div className="col-12">
              <select className="form-select bg-light border-0" value={ritmo} onChange={e => setRitmo(e.target.value)}>
                <option value="aperto">Aperto a tutti i ritmi</option>
                <option value="6:30-7:00">6:30 - 7:00</option>
                <option value="6:00-6:30">6:00 - 6:30</option>
                <option value="5:30-6:00">5:30 - 6:00</option>
                <option value="5:00-5:30">5:00 - 5:30</option>
              </select>
            </div>
            <div className="col-12 mt-3"><button onClick={creaUscita} className="btn text-white fw-bold w-100 py-2" style={{ backgroundColor: '#ff5722', borderRadius: '10px' }}>Pubblica Uscita</button></div>
          </div>
        </div>

        {/* Lista Uscite */}
        <h5 className="fw-bold mb-3">Prossime corse nella tua zona</h5>
        {uscite.length === 0 ? (
          <div className="text-center p-5 bg-white rounded shadow-sm"><p className="text-muted mb-0">Nessuna uscita in programma. Sii il primo a organizzarne una!</p></div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {uscite.map(u => (
              <div key={u.id} className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold mb-0 text-dark">{u.titolo}</h5>
                  <span className="badge rounded-pill" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>🏃 {u.ritmo_previsto}</span>
                </div>
                <p className="text-muted small mb-2">📅 {new Date(u.data_ora).toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} <br/> 📍 {u.punto_ritrovo || 'Punto da definire'}</p>
                {u.descrizione && <p className="small text-dark mb-3">{u.descrizione}</p>}
                <div className="mb-3 d-flex align-items-center gap-2"><span className="badge bg-light text-dark border">👥 {u.partecipanti?.length || 0} runner parteciperanno</span></div>
                <div className="d-flex gap-2 mt-auto">
                  <button onClick={() => partecipaUscita(u.id)} className="btn btn-sm btn-outline-dark fw-bold flex-grow-1" style={{ borderRadius: '8px' }}>Partecipo!</button>
                  <button onClick={() => apriChat(u)} className="btn btn-sm text-white fw-bold flex-grow-1" style={{ backgroundColor: '#1a1a1a', borderRadius: '8px' }}>💬 Chat</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}