import { useState } from 'react'

// Importa le future schermate (le creeremo dopo)
// import HomeFeed from './HomeFeed'
// import Cerca from './Cerca'
// import Profilo from './Profilo'

export default function MainApp({ utente, onLogout }: { utente: any, onLogout: () => void }) {
  const [tabAttiva, setTabAttiva] = useState('home')

  // Funzione per renderizzare la schermata corretta
  const renderSchermata = () => {
    switch (tabAttiva) {
      case 'home':
        return <div className="p-4 text-center text-muted">Qui ci sarà il Feed (Foto e Post)</div>
      case 'cerca':
        return <div className="p-4 text-center text-muted">Qui ci sarà la Ricerca Utenti</div>
      case 'profilo':
        return <div className="p-4 text-center text-muted">Qui ci sarà il Profilo (Foto, Follower, Post)</div>
      default:
        return <div className="p-4 text-center text-muted">In arrivo...</div>
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: '70px' }}>
      
      {/* SPAZIO PER IL CONTENUTO (Qui andranno i post o il profilo) */}
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '20px' }}>
        {renderSchermata()}
      </div>

      {/* BARRA DI NAVIGAZIONE IN BASSO (Stile Instagram) */}
      <nav 
        className="position-fixed bottom-0 w-100 bg-white border-top d-flex justify-content-around align-items-center" 
        style={{ height: '60px', zIndex: 1000 }}
      >
        {/* Tasto Home */}
        <button onClick={() => setTabAttiva('home')} className="btn border-0 fs-4" style={{ color: tabAttiva === 'home' ? '#1a1a1a' : '#8e8e8e' }}>
          🏠
        </button>

        {/* Tasto Runner (Reel) */}
        <button onClick={() => setTabAttiva('runner')} className="btn border-0 fs-4" style={{ color: tabAttiva === 'runner' ? '#1a1a1a' : '#8e8e8e' }}>
          🎬
        </button>

        {/* Tasto Notifiche/Scarpa */}
        <button className="btn border-0 fs-4 position-relative" style={{ color: '#8e8e8e' }}>
          👟
          {/* Pallino rosso notifiche */}
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
        </button>

        {/* Tasto Cerca */}
        <button onClick={() => setTabAttiva('cerca')} className="btn border-0 fs-4" style={{ color: tabAttiva === 'cerca' ? '#1a1a1a' : '#8e8e8e' }}>
          🔍
        </button>

        {/* Tasto Profilo */}
        <button onClick={() => setTabAttiva('profilo')} className="btn border-0 p-0">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png" 
            alt="Profilo" 
            style={{ width: '28px', height: '28px', borderRadius: '50%', border: tabAttiva === 'profilo' ? '2px solid #1a1a1a' : 'none' }} 
          />
        </button>
      </nav>

    </div>
  )
}