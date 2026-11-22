import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Bacheca({ utente, zonaId, onLogout }: { utente: any, zonaId: string, onLogout: () => void }) {
  const [uscite, setUscite] = useState<any[]>([])
  const [titolo, setTitolo] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [dataOra, setDataOra] = useState('')
  const [puntoRitrovo, setPuntoRitrovo] = useState('')
  const [ritmo, setRitmo] = useState('aperto')
  const [msg, setMsg] = useState('')
  // Nuovi stati per la Chat
  const [uscitaSelezionata, setUscitaSelezionata] = useState<any>(null)
  const [messaggi, setMessaggi] = useState<any[]>([])
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  // Carica le uscite della zona dell'utente
  const caricaUscite = async () => {
    if (!zonaId) return
    const { data, error } = await supabase
      .from('uscite')
      .select('*') // <-- Prende solo i dati dell'uscita
      .eq('zona_id', zonaId)
      .order('data_ora', { ascending: true })

    if (error) {
      console.error("Errore caricamento uscite:", error)
    } else {
      console.log("Uscite caricate:", data) // <-- Questo ci dice cosa arriva
      setUscite(data || [])
    }
  }
  useEffect(() => {
    caricaUscite()
  }, [zonaId])

  // Crea una nuova uscita
  
  const creaUscita = async () => {
    setMsg('')
    if (!titolo || !dataOra) return setMsg('Titolo e data sono obbligatori')

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
      setMsg('Errore: ' + error.message)
    } else {
      setMsg('Uscita pubblicata!')
      setTitolo('')
      setDescrizione('')
      setDataOra('')
      setPuntoRitrovo('')
      caricaUscite() // Ricarica la lista
    }
  }
  // Funzione per iscriversi a un'uscita
  const partecipaUscita = async (uscitaId: string) => {
    const { error } = await supabase
      .from('partecipanti')
      .insert({ uscita_id: uscitaId, utente_id: utente.id })

    if (error) {
      // Se l'errore è "duplicate key", significa che l'utente è già iscritto
      if (error.code === '23505') {
        alert('Sei già iscritto a questa uscita!')
      } else {
        alert('Errore: ' + error.message)
      }
    } else {
      alert('Iscrizione avvenuta con successo!')
      caricaUscite() // Ricarica la lista per mostrare l'aggiornamento
    }
  }
    // Carica i messaggi quando si apre una chat
  const apriChat = async (uscita: any) => {
    setUscitaSelezionata(uscita)
    const { data } = await supabase
      .from('messaggi')
      .select('*, profili(nome)')
      .eq('uscita_id', uscita.id)
      .order('creato_il', { ascending: true })
    
    if (data) setMessaggi(data)
  }

  // Invia un messaggio
  const inviaMessaggio = async () => {
    if (!nuovoMessaggio.trim() || !uscitaSelezionata) return

    const { error } = await supabase.from('messaggi').insert({
      uscita_id: uscitaSelezionata.id,
      utente_id: utente.id,
      testo: nuovoMessaggio
    })

    if (!error) {
      setNuovoMessaggio('')
      // Ricarica i messaggi
      const { data } = await supabase
        .from('messaggi')
        .select('*, profili(nome)')
        .eq('uscita_id', uscitaSelezionata.id)
        .order('creato_il', { ascending: true })
      if (data) setMessaggi(data)
    }
  }
    // Se c'è una chat aperta, mostra la schermata della chat
  if (uscitaSelezionata) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => setUscitaSelezionata(null)} style={{ marginBottom: '20px', padding: '8px' }}>
          ⬅ Torna alla Bacheca
        </button>
        <h3>Chat: {uscitaSelezionata.titolo}</h3>
        
        <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '20px', borderRadius: '8px' }}>
          {messaggi.length === 0 ? (
            <p style={{ color: '#888' }}>Nessun messaggio. Inizia tu la conversazione!</p>
          ) : (
            messaggi.map(m => (
              <div key={m.id} style={{ marginBottom: '10px', textAlign: m.utente_id === utente.id ? 'right' : 'left' }}>
                <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>{m.profili?.nome || 'Runner'}</span>
                <span style={{ backgroundColor: m.utente_id === utente.id ? '#dcf8c6' : '#f1f0f0', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
                  {m.testo}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Scrivi un messaggio..." 
            value={nuovoMessaggio} 
            onChange={e => setNuovoMessaggio(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button onClick={inviaMessaggio} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Invia
          </button>
        </div>
      </div>
    )
  }
  return (
    
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Bacheca Uscite</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Bacheca Uscite</h2>
        <button onClick={onLogout} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Esci
        </button>
      </div>
      {/* Modulo per creare una nuova uscita */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Organizza una corsa</h3>
        <input 
          type="text" placeholder="Titolo (es. Corsa mattutina)" value={titolo} onChange={e => setTitolo(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <textarea 
          placeholder="Descrizione (opzionale)" value={descrizione} onChange={e => setDescrizione(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <input 
          type="datetime-local" value={dataOra} onChange={e => setDataOra(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <input 
          type="text" placeholder="Punto di ritrovo (es. Villa Comunale)" value={puntoRitrovo} onChange={e => setPuntoRitrovo(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <select 
          value={ritmo} onChange={e => setRitmo(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        >
          <option value="aperto">Aperto a tutti i ritmi</option>
          <option value="6:30-7:00">6:30 - 7:00</option>
          <option value="6:00-6:30">6:00 - 6:30</option>
          <option value="5:30-6:00">5:30 - 6:00</option>
          <option value="5:00-5:30">5:00 - 5:30</option>
        </select>
        <button onClick={creaUscita} style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Pubblica Uscita
        </button>
        {msg && <p style={{ color: msg.includes('Errore') || msg.includes('obbligatori') ? 'red' : 'green' }}>{msg}</p>}
      </div>

      {/* Lista delle uscite */}
      <h3>Prossime corse nella tua zona</h3>
      {uscite.length === 0 ? (
        <p>Nessuna uscita in programma. Sii il primo a organizzarne una!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {uscite.map(u => (
            <div key={u.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{u.titolo}</h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>
                📅 {new Date(u.data_ora).toLocaleString('it-IT')} <br/>
                📍 {u.punto_ritrovo || 'Punto da definire'} <br/>
                🏃 Ritmo: {u.ritmo_previsto}
              </p>
              {u.descrizione && <p style={{ fontSize: '14px', fontStyle: 'italic' }}>{u.descrizione}</p>}
              <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                              <button 
                onClick={() => partecipaUscita(u.id)}
                style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
              >
                Partecipo!
              </button>
                            <button 
                onClick={() => apriChat(u)}
                style={{ marginLeft: '10px', marginTop: '10px', padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
              >
                💬 Apri Chat
              </button>
                Organizzata da: Te (o nome da profilo)
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 