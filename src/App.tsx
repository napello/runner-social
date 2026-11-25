import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Bacheca from './Bacheca'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [user, setUser] = useState<any>(null)
  
  const [profiloCompleto, setProfiloCompleto] = useState(false)
  const [nome, setNome] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [livello, setLivello] = useState('principiante')
  const [ritmo, setRitmo] = useState('6:00-6:30')
  const [zone, setZone] = useState<any[]>([])
  const [zonaScelta, setZonaScelta] = useState('')

  // 1. Controlla se l'utente è loggato
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Carica i dati del profilo e le zone
  useEffect(() => {
    if (user) {
      // Controlla se ha già una zona (profilo completo)
      supabase.from('profili').select('*').eq('id', user.id).single().then(({ data }: any) => {
        if (data && data.zona_id) {
          setProfiloCompleto(true)
          setZonaScelta(data.zona_id)
          if (data.nome) setNome(data.nome)
          if (data.livello) setLivello(data.livello)
          if (data.fascia_ritmo) setRitmo(data.fascia_ritmo)
            if (data.avatar_url) setAvatarUrl(data.avatar_url)
        }
      })
      
      // Carica la lista delle zone per il menu
      supabase.from('zone').select('*').then(({ data }: any) => {
        if (data) {
          setZone(data)
        }
      })
    }
  }, [user])
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMsg('Errore: ' + error.message)
    else setMsg('Registrato! Ora fai il login.')
  }

  const handleLogin = async () => {
    setMsg('') // Pulisce i messaggi vecchi
    if (!email || !password) return setMsg('Inserisci email e password')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        // Qui gestiamo il caso in cui l'utente non esiste o la password è sbagliata
        setMsg('Credenziali errate. Se è il tuo primo accesso, clicca su "Registrati". Altrimenti, clicca su "Password dimenticata?".')
      } else {
        setMsg('Errore: ' + error.message)
      }
    }
  }
    const handleResetPassword = async () => {
    if (!email) return setMsg('Inserisci la tua email per recuperare la password')
    
    setMsg('Invio email in corso...')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.runnersocial.it', // O il tuo link di Vercel
    })

    if (error) {
      setMsg('Errore: ' + error.message)
    } else {
      setMsg('Ti abbiamo inviato un link per reimpostare la password. Controlla la posta!')
    }
  }
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null) // Resetta l'utente loggato
    setProfiloCompleto(false) // Torna alla schermata di login
  }
    if (profiloCompleto) {
    return <Bacheca utente={user} zonaId={zonaScelta} onLogout={handleLogout} />
  }
  const salvaProfilo = async () => {
    if (!zonaScelta) return setMsg('Seleziona una zona')
    
    const { error } = await supabase
      .from('profili')
      .update({ nome: nome, livello: livello, fascia_ritmo: ritmo, zona_id: zonaScelta, avatar_url: avatarUrl })
      .eq('id', user.id)
      

    if (error) {
      setMsg('Errore salvataggio: ' + error.message)
    } else {
      setMsg('Profilo completato! Benvenuto.')
      setProfiloCompleto(true) // Sblocca la Bacheca
    }
  }

    // --- SEZIONE 1: Login / Registrazione ---
  // --- SEZIONE 1: Login / Registrazione ---
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundImage: 'url(https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }} className="d-flex justify-content-center align-items-center">
        
        <div className="card border-0 shadow-lg p-5" style={{ width: '420px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <div className="text-center mb-4">
            <h1 className="fw-bold" style={{ color: '#1a1a1a' }}>RunnerSocial</h1>
            <p className="text-muted fw-semibold">Trova il tuo ritmo. Trova la tua crew.</p>
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-bold small text-uppercase text-muted">Email</label>
            <input type="email" className="form-control form-control-lg bg-light border-0" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-bold small text-uppercase text-muted">Password</label>
            <input type="password" className="form-control form-control-lg bg-light border-0" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <div className="d-grid gap-3 mt-4">
            <button onClick={handleLogin} className="btn btn-lg text-white fw-bold" style={{ backgroundColor: '#ff5722', borderRadius: '10px' }}>
              Accedi
            </button>
            <button onClick={handleSignUp} className="btn btn-lg btn-outline-dark fw-bold" style={{ borderRadius: '10px' }}>
              Crea un account (Registrati)
            </button>
          </div>

          {/* Link per password dimenticata */}
          <div className="text-center mt-3">
            <button onClick={handleResetPassword} className="btn btn-link text-muted small text-decoration-none">
              Password dimenticata?
            </button>
          </div>
          
          {msg && <p className="text-center text-danger mt-3 fw-bold">{msg}</p>}
        </div>
      </div>
    )
  }
  // --- SEZIONE 2: Se il profilo è completo, mostra la Bacheca ---
  if (profiloCompleto) {
        return <Bacheca utente={user} zonaId={zonaScelta} onLogout={handleLogout} />
  }

  // --- SEZIONE 3: Altrimenti mostra l'Onboarding ---
     // --- SEZIONE 3: Onboarding (Profilo) ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Montserrat, sans-serif' }} className="d-flex justify-content-center align-items-center py-5">
      <div className="card border-0 shadow-lg p-5" style={{ width: '550px', borderRadius: '20px' }}>
        
        <h2 className="text-center fw-bold mb-1">Il tuo Profilo Runner</h2>
        <p className="text-center text-muted mb-4">Raccontaci chi sei</p>

        <div className="d-flex flex-column align-items-center mb-4">
          <div className="position-relative">
            <img 
              src={avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt="Avatar" 
              className="rounded-circle shadow-sm bg-light" 
              style={{ width: '120px', height: '120px', objectFit: 'cover', border: '4px solid white' }} 
            />
          </div>
          <div className="mt-3 w-100">
            <label className="form-label fw-bold small text-uppercase text-muted">Link Foto Profilo (opzionale)</label>
            <input 
              type="text" 
              className="form-control bg-light border-0" 
              placeholder="Incolla un link a un'immagine..." 
              value={avatarUrl} 
              onChange={e => setAvatarUrl(e.target.value)} 
            />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-bold small text-uppercase text-muted">Come ti chiami?</label>
            <input type="text" className="form-control form-control-lg bg-light border-0" placeholder="Il tuo nome" value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small text-uppercase text-muted">Livello</label>
            <select className="form-select form-select-lg bg-light border-0" value={livello} onChange={e => setLivello(e.target.value)}>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzato">Avanzato</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold small text-uppercase text-muted">Ritmo (al km)</label>
            <select className="form-select form-select-lg bg-light border-0" value={ritmo} onChange={e => setRitmo(e.target.value)}>
              <option value="7:00+">Più lento di 7:00</option>
              <option value="6:30-7:00">6:30 - 7:00</option>
              <option value="6:00-6:30">6:00 - 6:30</option>
              <option value="5:30-6:00">5:30 - 6:00</option>
              <option value="5:00-5:30">5:00 - 5:30</option>
              <option value="aperto">Aperto a tutti</option>
            </select>
          </div>

          <div className="col-12 mb-4">
            <label className="form-label fw-bold small text-uppercase text-muted">La tua zona</label>
            <select className="form-select form-select-lg bg-light border-0" value={zonaScelta} onChange={e => setZonaScelta(e.target.value)}>
              <option value="">Seleziona la tua città/zona...</option>
              {zone.map(z => (
                <option key={z.id} value={z.id}>{z.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={salvaProfilo} className="btn btn-lg w-100 text-white fw-bold shadow-sm" style={{ backgroundColor: '#ff5722', borderRadius: '10px' }}>
          Inizia a Correre
        </button>

        {msg && <p className="text-center text-danger mt-3 fw-bold">{msg}</p>}
      </div>
    </div>
  )
}

export default App