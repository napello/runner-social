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
  const [livello, setLivello] = useState('principiante')
  const [ritmo, setRitmo] = useState('6:00-6:30')
  const [zone, setZone] = useState<any[]>([])
  const [zonaScelta, setZonaScelta] = useState('')

  // 1. Controlla se l'utente è loggato
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Carica i dati del profilo e le zone
  useEffect(() => {
    if (user) {
      // Controlla se ha già una zona (profilo completo)
      supabase.from('profili').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data && data.zona_id) {
          setProfiloCompleto(true)
          setZonaScelta(data.zona_id)
          if (data.nome) setNome(data.nome)
          if (data.livello) setLivello(data.livello)
          if (data.fascia_ritmo) setRitmo(data.fascia_ritmo)
        }
      })
      
      // Carica la lista delle zone per il menu
      supabase.from('zone').select('*').then(({ data }) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg('Errore: ' + error.message)
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
      .update({ nome: nome, livello: livello, fascia_ritmo: ritmo, zona_id: zonaScelta })
      .eq('id', user.id)

    if (error) {
      setMsg('Errore salvataggio: ' + error.message)
    } else {
      setMsg('Profilo completato! Benvenuto.')
      setProfiloCompleto(true) // Sblocca la Bacheca
    }
  }

  // --- SEZIONE 1: Login / Registrazione ---
  if (!user) {
    return (
      <div style={{ padding: '50px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Accedi a RunnerSocial</h1>
        <input 
          type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} 
          style={{ display: 'block', marginBottom: '10px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
        />
        <input 
          type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} 
          style={{ display: 'block', marginBottom: '10px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
        />
        <button onClick={handleLogin} style={{ padding: '10px', width: '100%', marginBottom: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          Accedi
        </button>
        <button onClick={handleSignUp} style={{ padding: '10px', width: '100%', backgroundColor: '#eee', border: 'none', cursor: 'pointer' }}>
          Registrati
        </button>
        {msg && <p style={{ color: 'blue', textAlign: 'center' }}>{msg}</p>}
      </div>
    )
  }

  // --- SEZIONE 2: Se il profilo è completo, mostra la Bacheca ---
  if (profiloCompleto) {
        return <Bacheca utente={user} zonaId={zonaScelta} onLogout={handleLogout} />
  }

  // --- SEZIONE 3: Altrimenti mostra l'Onboarding ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Completa il tuo profilo</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Aiutaci a trovarti i compagni di corsa giusti.</p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Come ti chiami?</label>
        <input 
          type="text" placeholder="Il tuo nome" value={nome} onChange={e => setNome(e.target.value)}
          style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Il tuo livello:</label>
        <select value={livello} onChange={e => setLivello(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzato">Avanzato</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>La tua fascia di ritmo:</label>
        <select value={ritmo} onChange={e => setRitmo(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="7:00+">Più lento di 7:00</option>
          <option value="6:30-7:00">6:30 - 7:00</option>
          <option value="6:00-6:30">6:00 - 6:30</option>
          <option value="5:30-6:00">5:30 - 6:00</option>
          <option value="5:00-5:30">5:00 - 5:30</option>
          <option value="aperto">Aperto a tutti i ritmi</option>
        </select>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>La tua zona principale:</label>
        <select value={zonaScelta} onChange={e => setZonaScelta(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="">Seleziona una zona...</option>
          {zone.map(z => (
            <option key={z.id} value={z.id}>{z.nome}</option>
          ))}
        </select>
      </div>

      <button onClick={salvaProfilo} style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
        Salva Profilo e Inizia
      </button>

      {msg && <p style={{ marginTop: '20px', color: msg.includes('Errore') ? 'red' : 'green', textAlign: 'center' }}>{msg}</p>}
    </div>
  )
}

export default App