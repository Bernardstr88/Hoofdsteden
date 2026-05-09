import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import countriesData from './countries.json'

type Country = {
  code: string
  code2: string
  codeNum: string
  name: string
  capital: string
  region: string
  lat: number
  lng: number
}

const countries = countriesData as Country[]
const byNumeric = new Map(countries.map((c) => [c.codeNum, c]))

const REGIONS = ['Alle', 'Europe', 'Asia', 'Africa', 'Americas', 'Oceania', 'Antarctic'] as const
type Region = (typeof REGIONS)[number]

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export default function App() {
  const [selected, setSelected] = useState<Country | null>(null)
  const [hovered, setHovered] = useState<Country | null>(null)
  const [practice, setPractice] = useState(false)
  const [guess, setGuess] = useState('')
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<Region>('Alle')
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const filtered = useMemo(() => {
    return countries.filter((c) => {
      if (region !== 'Alle' && c.region !== region) return false
      if (search && !normalize(c.name).includes(normalize(search))) return false
      return true
    })
  }, [search, region])

  const select = (c: Country | null) => {
    setSelected(c)
    setGuess('')
    setFeedback('idle')
  }

  const submitGuess = () => {
    if (!selected || !guess.trim()) return
    const ok = normalize(guess) === normalize(selected.capital)
    setFeedback(ok ? 'correct' : 'wrong')
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
  }

  const randomCountry = () => {
    const pool = filtered.length > 0 ? filtered : countries
    const c = pool[Math.floor(Math.random() * pool.length)]
    select(c)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">🌍 Hoofdsteden</h1>
          <span className="text-sm text-slate-500">{countries.length} landen</span>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={practice}
                onChange={(e) => {
                  setPractice(e.target.checked)
                  setFeedback('idle')
                  setGuess('')
                }}
                className="h-4 w-4 accent-indigo-600"
              />
              Oefenmodus
            </label>
            {practice && (
              <span className="text-sm tabular-nums text-slate-600">
                {score.correct}/{score.total}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ComposableMap
            projectionConfig={{ scale: 155 }}
            style={{ width: '100%', height: 'auto' }}
          >
            <ZoomableGroup center={[0, 20]} zoom={1}>
              <Geographies geography="/world-110m.json">
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const id = String(geo.id).padStart(3, '0')
                    const country = byNumeric.get(id)
                    const isSelected = selected?.codeNum === id
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => country && setHovered(country)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => country && select(country)}
                        style={{
                          default: {
                            fill: isSelected ? '#4f46e5' : '#cbd5e1',
                            stroke: '#fff',
                            strokeWidth: 0.5,
                            outline: 'none',
                          },
                          hover: {
                            fill: isSelected ? '#4f46e5' : '#94a3b8',
                            stroke: '#fff',
                            strokeWidth: 0.5,
                            outline: 'none',
                            cursor: country ? 'pointer' : 'default',
                          },
                          pressed: {
                            fill: '#4338ca',
                            outline: 'none',
                          },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          <div className="px-4 py-2 border-t border-slate-100 text-sm text-slate-500 min-h-[2.25rem]">
            {hovered ? (
              <span>
                <span className="font-medium text-slate-700">{hovered.name}</span>
                {!practice && <span> — {hovered.capital}</span>}
              </span>
            ) : (
              <span>Beweeg over een land of klik om te selecteren</span>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Selectie</h2>
              <button
                onClick={randomCountry}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                🎲 Willekeurig
              </button>
            </div>
            {selected ? (
              <div className="space-y-2">
                <div className="text-2xl font-semibold">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.region}</div>

                {practice ? (
                  <div className="pt-2 space-y-2">
                    <label className="text-sm text-slate-600">Wat is de hoofdstad?</label>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={guess}
                        onChange={(e) => {
                          setGuess(e.target.value)
                          setFeedback('idle')
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                        placeholder="Hoofdstad…"
                        className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={submitGuess}
                        className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Check
                      </button>
                    </div>
                    {feedback === 'correct' && (
                      <div className="text-sm text-emerald-600 font-medium">
                        ✅ Juist! {selected.capital}
                      </div>
                    )}
                    {feedback === 'wrong' && (
                      <div className="text-sm text-rose-600 font-medium">
                        ❌ Fout — {selected.capital}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Hoofdstad</div>
                    <div className="text-xl font-medium text-indigo-700">{selected.capital}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Klik een land op de kaart of kies in de lijst hieronder.
              </p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h2 className="font-semibold">Zoeken</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op landnaam…"
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-1">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`text-xs px-2 py-1 rounded-md border ${
                    region === r
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto -mx-1">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  onClick={() => select(c)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center justify-between ${
                    selected?.code === c.code ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>{c.name}</span>
                  {!practice && <span className="text-slate-400 text-xs">{c.capital}</span>}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-slate-400 px-2 py-3">Geen landen gevonden.</p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
