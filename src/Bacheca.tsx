import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Bacheca({ utente, zonaId, onLogout }: { utente: any, zonaId: string, onLogout: () => void }) {
  // Stati per la Bacheca
  const [uscite, setUscite] = useState<any[]>([])
  const [titolo, setTitolo] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [dataOra, setDataOra] = useState('')
  const [puntoRitrovo, setPuntoRitrovo] = useState('')
  const [ritmo, setRitmo] = useState('aperto')
  //stati per le notifiche
  const [notifiche, setNotifiche] = useState<any[]>([])
  const [mostraNotifiche, setMostraNotifiche] = useState(false)
  // Stati per la Chat
  const [uscitaSelezionata, setUscitaSelezionata] = useState<any>(null)
  const [messaggi, setMessaggi] = useState<any[]>([])
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  
  // Stati per Profilo e Storie
  const [nomeUtente, setNomeUtente] = useState('Runner')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [mostraProfilo, setMostraProfilo] = useState(false)
  const [runnerZona, setRunnerZona] = useState<any[]>([])
  const [runnerSelezionato, setRunnerSelezionato] = useState<any>(null) // Per la card della storia

  // Stato per il Toast (notifica elegante)
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null)

  useEffect(() => {
    // Prendi i dati dell'utente loggato
    supabase.from('profili').select('*').eq('id', utente.id).single().then(({ data }) => {
      if (data) {
        if (data.nome) setNomeUtente(data.nome)
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
      }
    })
    
    // Prendi gli altri runner nella stessa zona per le storie
    supabase.from('profili').select('*').eq('zona_id', zonaId).then(({ data }) => {
      if (data) setRunnerZona(data)
    })

    caricaUscite()
  }, [zonaId])
    // Carica le notifiche
    supabase.from('notifiche').select('*').eq('utente_id', utente.id).eq('letta', false).order('creato_il', { ascending: false }).then(({ data }) => {
      if (data) setNotifiche(data)
    })
  // Funzione per mostrare il toast e farlo sparire dopo 3 secondi
  const mostraToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const caricaUscite = async () => {
    if (!zonaId) return
    // Prendiamo le uscite e contiamo i partecipanti
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
      setTitolo('')
      setDescrizione('')
      setDataOra('')
      setPuntoRitrovo('')
      caricaUscite()
    }
  }

  const partecipaUscita = async (uscitaId: string) => {
    const { error } = await supabase
      .from('partecipanti')
      .insert({ uscita_id: uscitaId, utente_id: utente.id })

    if (error) {
      if (error.code === '23505') mostraToast('Sei già iscritto a questa uscita!', 'error')
      else mostraToast('Errore: ' + error.message, 'error')
    } else {
      mostraToast('Iscrizione avvenuta con successo!')
      caricaUscite() // Ricarica per aggiornare il contatore
    }
  }

  const apriChat = async (uscita: any) => {
    setUscitaSelezionata(uscita)
    const { data } = await supabase
      .from('messaggi')
      .select('*, profili(nome)')
      .eq('uscita_id', uscita.id)
      .order('creato_il', { ascending: true })
    
    if (data) setMessaggi(data)
  }

  const inviaMessaggio = async () => {
    if (!nuovoMessaggio.trim() || !uscitaSelezionata) return

    const { error } = await supabase.from('messaggi').insert({
      uscita_id: uscitaSelezionata.id,
      utente_id: utente.id,
      testo: nuovoMessaggio
    })

    if (!error) {
      setNuovoMessaggio('')
      const { data } = await supabase
        .from('messaggi')
        .select('*, profili(nome)')
        .eq('uscita_id', uscitaSelezionata.id)
        .order('creato_il', { ascending: true })
      if (data) setMessaggi(data)
    }
  }

  // --- VISTA CHAT ---
  if (uscitaSelezionata) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }}>
        <nav className="navbar navbar-dark shadow-sm mb-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container">
            <button onClick={() => setUscitaSelezionata(null)} className="btn btn-outline-light btn-sm">
              ⬅ Torna alla Bacheca
            </button>
            <span className="navbar-brand mb-0 h1 fs-6">Chat: {uscitaSelezionata.titolo}</span>
          </div>
        </nav>

        <div className="container" style={{ maxWidth: '700px' }}>
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
            <div style={{ height: '400px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {messaggi.length === 0 ? (
                <p className="text-center text-muted mt-5">Nessun messaggio. Inizia tu la conversazione!</p>
              ) : (
                messaggi.map(m => (
                  <div key={m.id} className={`d-flex flex-column mb-3 ${m.utente_id === utente.id ? 'align-items-end' : 'align-items-start'}`}>
                    <span className="small text-muted mb-1">{m.profili?.nome || 'Runner'}</span>
                    <span className="px-3 py-2" style={{ 
                      backgroundColor: m.utente_id === utente.id ? '#ff5722' : '#e9ecef', 
                      color: m.utente_id === utente.id ? 'white' : 'black',
                      borderRadius: '15px',
                      maxWidth: '75%'
                    }}>
                      {m.testo}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                placeholder="Scrivi un messaggio..." 
                value={nuovoMessaggio} 
                onChange={e => setNuovoMessaggio(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviaMessaggio()}
              />
              <button onClick={inviaMessaggio} className="btn text-white fw-bold px-4" style={{ backgroundColor: '#ff5722' }}>
                Invia
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA PROFILO ---  // --- VISTA PROFILO (Modificabile) ---
  if (mostraProfilo) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }}>
        <nav className="navbar navbar-dark shadow-sm mb-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="container">
            <button onClick={() => setMostraProfilo(false)} className="btn btn-outline-light btn-sm">
              ⬅ Torna alla Bacheca
            </button>
            <span className="navbar-brand mb-0 h1 fs-6">Il mio Profilo</span>
          </div>
        </nav>

        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
            <h4 className="fw-bold mb-4 text-center">Modifica i tuoi dati</h4>

            {/* Avatar */}
            <div className="text-center mb-4">
              <img 
                src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                className="rounded-circle shadow mb-3" 
                style={{ width: '120px', height: '120px', objectFit: 'cover', border: '4px solid white' }} 
              />
              <label className="form-label fw-bold small text-uppercase text-muted d-block">Link Foto Profilo</label>
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                placeholder="https://..." 
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)} 
              />
            </div>

            {/* Nome */}
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase text-muted">Il tuo nome</label>
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                value={nomeUtente} 
                onChange={e => setNomeUtente(e.target.value)} 
              />
            </div>

            <button 
              onClick={async () => {
                const { error } = await supabase
                  .from('profili')
                  .update({ nome: nomeUtente, avatar_url: avatarUrl })
                  .eq('id', utente.id)

                if (error) mostraToast('Errore: ' + error.message, 'error')
                else {
                  mostraToast('Profilo aggiornato con successo!')
                  setMostraProfilo(false) // Torna alla bacheca
                }
              }} 
              className="btn text-white fw-bold w-100 mb-4" 
              style={{ backgroundColor: '#ff5722', borderRadius: '10px' }}
            >
              Salva Modifiche
            </button>

            <hr />

            <button onClick={onLogout} className="btn btn-outline-danger w-100 mt-2">
              Disconnetti
            </button>
          </div>
        </div>
      </div>
    )
  }


    const inviaInvito = async (runner: any) => {
    const { error } = await supabase.from('notifiche').insert({
      utente_id: runner.id,
      messaggio: `${nomeUtente} ti ha invitato a correre insieme!`
    })

    if (error) mostraToast('Errore invio invito: ' + error.message, 'error')
    else {
      mostraToast(`Invito inviato a ${runner.nome}!`)
      setRunnerSelezionato(null) // Chiude la card
    }
  }
  // --- VISTA BACHECA PRINCIPALE ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* TOAST DI NOTIFICA (in alto a destra) */}
      {toast && (
        <div 
          className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow text-white fw-bold ${toast.type === 'success' ? 'bg-success' : 'bg-danger'}`}
          style={{ zIndex: 1050, animation: 'fadeIn 0.3s ease-in-out' }}
        >
          {toast.msg}
        </div>
      )}

      {/* Navbar Superiore */}
      <nav className="navbar navbar-dark shadow-sm mb-0" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="container">
          <span className="navbar-brand fw-bold mb-0 h1">RunnerSocial</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small fw-semibold d-none d-md-block">Ciao, {nomeUtente}</span>
            <img 
              src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt="Profilo" 
              onClick={() => setMostraProfilo(true)}
              style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', border: '2px solid white' }}
            />
          </div>
        </div>
                    <div className="position-relative me-3" style={{ cursor: 'pointer' }} onClick={() => setMostraNotifiche(!mostraNotifiche)}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              {notifiche.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                  {notifiche.length}
                </span>
              )}
            </div>
                  {/* Dropdown Notifiche */}
      {mostraNotifiche && (
        <div className="position-absolute end-0 mt-2 me-4 card shadow-lg border-0" style={{ width: '300px', zIndex: 1050, top: '60px' }}>
          <div className="card-header bg-white fw-bold border-0 pt-3">Notifiche</div>
          <div className="card-body p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifiche.length === 0 ? (
              <p className="text-muted text-center p-3 mb-0 small">Nessuna nuova notifica</p>
            ) : (
              notifiche.map(n => (
                <div key={n.id} className="p-3 border-bottom small">
                  {n.messaggio}
                  <br/>
                  <span className="text-muted" style={{ fontSize: '10px' }}>
                    {new Date(n.creato_il).toLocaleTimeString('it-IT')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </nav>

      {/* Barra delle Storie */}
      <div className="bg-white shadow-sm py-3 mb-4" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div className="container d-flex gap-3">
          {runnerZona.length > 0 ? runnerZona.map((r) => (
            <div key={r.id} className="text-center" style={{ cursor: 'pointer' }} onClick={() => setRunnerSelezionato(r)}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', padding: '3px', 
                background: 'linear-gradient(45deg, #ff5722, #ff9800)' 
              }}>
                <img 
                  src={r.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} 
                />
              </div>
              <span className="small text-muted" style={{ fontSize: '11px' }}>{r.nome?.split(' ')[0]}</span>
            </div>
          )) : (
            <span className="text-muted small">Nessun altro runner nella tua zona per ora.</span>
          )}
        </div>
      </div>

      {/* CARD DELLA STORIA (se clicchi un runner) */}
      {runnerSelezionato && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg p-4 text-center" style={{ width: '300px', borderRadius: '20px' }}>
            <img 
              src={runnerSelezionato.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              className="rounded-circle mx-auto mb-3" 
              style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
            />
            <h4 className="fw-bold">{runnerSelezionato.nome}</h4>
            <p className="text-muted small mb-1">Livello: {runnerSelezionato.livello}</p>
            <p className="text-muted small mb-3">Ritmo: {runnerSelezionato.fascia_ritmo}</p>
            <button className="btn text-white w-100 mb-2" style={{ backgroundColor: '#ff5722' }}>
              Invita a correre
            </button>
                        <button onClick={() => inviaInvito(runnerSelezionato)} className="btn text-white w-100 mb-2" style={{ backgroundColor: '#ff5722' }}>
              Invita a correre
            </button>
          </div>
        </div>
      )}

      <div className="container pb-5" style={{ maxWidth: '800px' }}>
        
        {/* Modulo Crea Uscita */}
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '15px' }}>
          <h4 className="fw-bold mb-3">Organizza una corsa</h4>
          <div className="row g-3">
            <div className="col-12">
              <input type="text" className="form-control bg-light border-0" placeholder="Titolo (es. Corsa mattutina)" value={titolo} onChange={e => setTitolo(e.target.value)} />
            </div>
            <div className="col-12">
              <textarea className="form-control bg-light border-0" placeholder="Descrizione (opzionale)" value={descrizione} onChange={e => setDescrizione(e.target.value)} rows={2} />
            </div>
            <div className="col-md-6">
              <input type="datetime-local" className="form-control bg-light border-0" value={dataOra} onChange={e => setDataOra(e.target.value)} />
            </div>
            <div className="col-md-6">
              <input type="text" className="form-control bg-light border-0" placeholder="Punto di ritrovo" value={puntoRitrovo} onChange={e => setPuntoRitrovo(e.target.value)} />
            </div>
            <div className="col-12">
              <select className="form-select bg-light border-0" value={ritmo} onChange={e => setRitmo(e.target.value)}>
                <option value="aperto">Aperto a tutti i ritmi</option>
                <option value="6:30-7:00">6:30 - 7:00</option>
                <option value="6:00-6:30">6:00 - 6:30</option>
                <option value="5:30-6:00">5:30 - 6:00</option>
                <option value="5:00-5:30">5:00 - 5:30</option>
              </select>
            </div>
            <div className="col-12 mt-3">
              <button onClick={creaUscita} className="btn text-white fw-bold w-100 py-2" style={{ backgroundColor: '#ff5722', borderRadius: '10px' }}>
                Pubblica Uscita
              </button>
            </div>
          </div>
        </div>

        {/* Lista Uscite */}
        <h5 className="fw-bold mb-3">Prossime corse nella tua zona</h5>
        
        {uscite.length === 0 ? (
          <div className="text-center p-5 bg-white rounded shadow-sm">
            <p className="text-muted mb-0">Nessuna uscita in programma. Sii il primo a organizzarne una!</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {uscite.map(u => (
              <div key={u.id} className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold mb-0 text-dark">{u.titolo}</h5>
                  <span className="badge rounded-pill" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
                    🏃 {u.ritmo_previsto}
                  </span>
                </div>
                
                <p className="text-muted small mb-2">
                  📅 {new Date(u.data_ora).toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} <br/>
                  📍 {u.punto_ritrovo || 'Punto da definire'}
                </p>

                {u.descrizione && <p className="small text-dark mb-3">{u.descrizione}</p>}
                
                {/* Contatore partecipanti */}
                <div className="mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark border">
                    👥 {u.partecipanti?.length || 0} runner parteciperanno
                  </span>
                </div>
                
                <div className="d-flex gap-2 mt-auto">
                  <button onClick={() => partecipaUscita(u.id)} className="btn btn-sm btn-outline-dark fw-bold flex-grow-1" style={{ borderRadius: '8px' }}>
                    Partecipo!
                  </button>
                  <button onClick={() => apriChat(u)} className="btn btn-sm text-white fw-bold flex-grow-1" style={{ backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                    💬 Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}