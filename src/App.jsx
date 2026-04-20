import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('lobby')
  const [gameCode, setGameCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [game, setGame] = useState(null)
  const [team, setTeam] = useState(null)
  const [teams, setTeams] = useState([])

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const createGame = async () => {
    const code = generateCode()
    const { data, error } = await supabase
      .from('games')
      .insert({ code, status: 'waiting' })
      .select()
      .single()
    
    if (error) { console.error(error); return }
    setGame(data)
    setGameCode(code)
    setScreen('waiting')
  }

  const joinGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .select()
      .eq('code', gameCode.toUpperCase())
      .single()
    
    if (error || !data) { alert('Spelkod hittades inte'); return }
    setGame(data)
    setScreen('waiting')
  }

  const createTeam = async () => {
    if (!teamName || !game) return
    const colors = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899']
    const { data: existingTeams } = await supabase
      .from('teams')
      .select()
      .eq('game_id', game.id)
    
    const color = colors[existingTeams?.length || 0]
    const { data, error } = await supabase
      .from('teams')
      .insert({
        game_id: game.id,
        name: teamName,
        cash: 2000,
        turn_order: (existingTeams?.length || 0) + 1,
        color,
        board_position: 0
      })
      .select()
      .single()
    
    if (error) { console.error(error); return }
    setTeam(data)
  }

  useEffect(() => {
    if (!game) return
    const channel = supabase
      .channel('teams')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `game_id=eq.${game.id}`
      }, () => {
        supabase.from('teams').select().eq('game_id', game.id)
          .then(({ data }) => setTeams(data || []))
      })
      .subscribe()

    supabase.from('teams').select().eq('game_id', game.id)
      .then(({ data }) => setTeams(data || []))

    return () => supabase.removeChannel(channel)
  }, [game])

  if (screen === 'lobby') return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#1e293b',
        padding: '2rem',
        borderRadius: '16px',
        width: '360px',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Gastronoma</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Södermalms restaurangsimulator
        </p>
        
        <button onClick={createGame} style={{
          width: '100%',
          padding: '12px',
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '12px'
        }}>
          Skapa nytt spel
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            placeholder="Spelkod"
            value={gameCode}
            onChange={e => setGameCode(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white',
              fontSize: '16px'
            }}
          />
          <button onClick={joinGame} style={{
            padding: '12px 16px',
            background: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            Gå med
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === 'waiting') return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#1e293b',
        padding: '2rem',
        borderRadius: '16px',
        width: '400px',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '4px' }}>Spelkod</h2>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#3B82F6',
          letterSpacing: '8px',
          marginBottom: '1.5rem'
        }}>
          {game?.code}
        </div>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          Dela koden med de andra lagen
        </p>

        {!team && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <input
              placeholder="Lagets namn"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: 'white',
                fontSize: '16px'
              }}
            />
            <button onClick={createTeam} style={{
              padding: '12px 16px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Registrera
            </button>
          </div>
        )}

        <div>
          <p style={{ color: '#94a3b8', marginBottom: '8px' }}>
            Lag som anslutit ({teams.length}/6):
          </p>
          {teams.map(t => (
            <div key={t.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: '#0f172a',
              borderRadius: '8px',
              marginBottom: '4px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: t.color
              }}/>
              <span>{t.name}</span>
              {t.id === team?.id && (
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  (dig)
                </span>
              )}
            </div>
          ))}
        </div>

        {teams.length >= 2 && team && (
          <button
            onClick={() => setScreen('game')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Starta spelet →
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h2>Spelet startar här — kartan och spelbordet byggs nästa steg</h2>
    </div>
  )
}