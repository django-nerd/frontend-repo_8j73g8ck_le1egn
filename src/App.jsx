import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import DataBreakdown from './components/DataBreakdown'
import GBNSimulation from './components/GBNSimulation'

function App() {
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [caption, setCaption] = useState('')
  const startRef = useRef(null)

  const start = () => {
    setRunning(true)
    setCaption('Go-Back-N allows multiple packets to be in flight.')
  }

  const reset = () => {
    setRunning(false)
    setCaption('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 text-gray-800">
      {/* Header */}
      <header className="py-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Computer Networking 100</h1>
      </header>

      {/* Pre-simulation visualization */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl border bg-white/70 backdrop-blur p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 text-center">Pre-simulation: Data to Packets</h2>
          <DataBreakdown running={running} speed={speed} />
        </div>
      </section>

      {/* Main simulation */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">GBN Protocol Simulation</h2>
              <p className="text-sm text-gray-500">Visualize sender, receiver, and sliding window behavior.</p>
            </div>
            <div className="text-sm text-gray-600">Window size = 5</div>
          </div>

          <div className="mt-4">
            <GBNSimulation running={running} speed={speed} onCaption={setCaption} />
          </div>

          {/* Educational captions */}
          <div className="mt-4 text-center text-sm text-gray-700 min-h-[24px]">
            {caption}
          </div>

          {/* Control panel */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              ref={startRef}
              onClick={start}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={running}
              title="Start Simulation"
            >
              Start Simulation
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
              title="Reset"
            >
              Reset
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm">Speed</span>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.5}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-600">x{speed}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-sm text-gray-500">
        Made by Joy Deep Saha
      </footer>
    </div>
  )
}

export default App
