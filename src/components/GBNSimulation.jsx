import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const PACKET_COUNT = 12
const WINDOW_SIZE = 5

const colors = {
  inflight: 'bg-gray-200 border-gray-300 text-gray-700',
  acked: 'bg-green-100 border-green-300 text-green-700',
  lost: 'bg-red-100 border-red-300 text-red-700',
  retransmit: 'bg-blue-100 border-blue-300 text-blue-700',
}

function Packet({ id, status, onHover, y = 0 }) {
  const colorClass =
    status === 'acked'
      ? colors.acked
      : status === 'lost'
      ? colors.lost
      : status === 'retransmit'
      ? colors.retransmit
      : colors.inflight

  return (
    <motion.div
      layout
      onMouseEnter={() => onHover?.(id, status)}
      className={`px-3 py-2 rounded-md border shadow-sm text-sm font-medium ${colorClass}`}
      style={{ y }}
    >
      {id}
    </motion.div>
  )
}

export default function GBNSimulation({ running, speed = 1, onCaption }) {
  const [packets, setPackets] = useState(
    Array.from({ length: PACKET_COUNT }, (_, i) => ({ id: i, status: 'pending' }))
  )
  const [base, setBase] = useState(0) // first unACKed
  const [nextSeq, setNextSeq] = useState(0)
  const [lostIndex] = useState(2) // deterministic: lose packet #2 first time
  const [hoverInfo, setHoverInfo] = useState(null)
  const timerRef = useRef(null)
  const timeoutRef = useRef(null)
  const sentSetRef = useRef(new Set())
  const lostOnceRef = useRef(false)

  const stepDelay = Math.max(550 / speed, 150)
  const timeoutDelay = Math.max(2200 / speed, 800)

  const reset = () => {
    setPackets(Array.from({ length: PACKET_COUNT }, (_, i) => ({ id: i, status: 'pending' })))
    setBase(0)
    setNextSeq(0)
    sentSetRef.current = new Set()
    lostOnceRef.current = false
    onCaption?.('Ready to start. Go-Back-N allows multiple packets to be in flight.')
  }

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current)
      clearTimeout(timeoutRef.current)
      return
    }

    onCaption?.('Sending a window of packets. Only in-order packets are accepted by receiver.')
    timerRef.current = setInterval(step, stepDelay)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [running, stepDelay])

  useEffect(() => {
    // Start/restart timer when base moves or when new packets sent
    if (!running || base === nextSeq) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      // timeout: retransmit from base
      onCaption?.(`Timeout triggered. Retransmitting from packet ${base}.`)
      setPackets((prev) =>
        prev.map((p, idx) =>
          idx >= base && idx < Math.min(base + WINDOW_SIZE, PACKET_COUNT)
            ? { ...p, status: 'retransmit' }
            : p
        )
      )
      setNextSeq(base)
    }, timeoutDelay)
  }, [base, nextSeq, running, timeoutDelay])

  const step = () => {
    setPackets((prev) => {
      const arr = [...prev]

      // send new packets while window has space
      while (nextSeq < base + WINDOW_SIZE && nextSeq < PACKET_COUNT) {
        if (!sentSetRef.current.has(nextSeq)) {
          sentSetRef.current.add(nextSeq)
          if (nextSeq === lostIndex && !lostOnceRef.current) {
            arr[nextSeq] = { ...arr[nextSeq], status: 'lost' }
            onCaption?.(`Packet ${lostIndex} lost. Receiver cannot proceed.`)
          } else {
            arr[nextSeq] = { ...arr[nextSeq], status: 'inflight' }
          }
        }
        setNextSeq((s) => s + 1)
      }

      // receiver behavior and ACKing
      // find first expected = base
      if (arr[base] && arr[base].status !== 'lost' && arr[base].status !== 'pending') {
        // If arrived (inflight or retransmit), ACK and slide window
        arr[base] = { ...arr[base], status: 'acked' }
        setBase((b) => b + 1)
        onCaption?.(`ACK ${base} received. Window slides forward.`)
      } else if (arr[base] && arr[base].status === 'lost') {
        // keep sending duplicate ACK for base-1
        const ackNum = Math.max(base - 1, -1)
        if (ackNum >= 0) onCaption?.(`ACK ${ackNum} received again. Waiting for packet ${base}.`))
      }

      // When we timed out after losing, allow retransmission path once
      if (arr[base] && arr[base].status === 'lost') {
        lostOnceRef.current = true
      }

      return arr
    })
  }

  const windowStart = base
  const windowEnd = Math.min(base + WINDOW_SIZE - 1, PACKET_COUNT - 1)

  const onHover = (id, status) => {
    setHoverInfo({ id, status, ts: Date.now() })
  }

  useEffect(() => {
    if (!running) reset()
  }, [running])

  return (
    <div className="w-full">
      <div className="grid grid-rows-2 gap-6">
        {/* Host A (Sender) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Host A (Sender)</h3>
            <div className="text-xs text-gray-500">Window size = {WINDOW_SIZE}</div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-white p-4">
            {/* Window overlay using border + arrow markers */}
            <div className="absolute inset-y-0 left-0 pointer-events-none flex items-center">
              <div
                className="h-24 border-2 border-blue-300/70 rounded-md"
                style={{
                  width: `calc(${WINDOW_SIZE} * 56px + ${(WINDOW_SIZE - 1) * 8}px)`,
                  transform: `translateX(${windowStart * 64}px)`,
                  transition: `transform ${0.4 / speed}s ease`,
                }}
              />
            </div>

            <div className="flex gap-2 relative" style={{ height: 64 }}>
              {packets.map((p, i) => (
                <motion.div key={p.id} layout className="relative" style={{ x: i * 64 }}>
                  <Packet id={p.id} status={p.status === 'pending' ? 'inflight' : p.status} onHover={onHover} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Host B (Receiver) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Host B (Receiver)</h3>
            <div className="text-xs text-gray-500">Next expected: {base}</div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-white p-4">
            <div className="flex gap-2" style={{ height: 64 }}>
              {packets.map((p) => (
                <div key={p.id} className="w-14 text-center text-xs text-gray-500 pt-4">
                  {p.status === 'acked' ? 'ACK' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoverInfo && (
        <div className="mt-2 text-xs text-gray-600">
          Packet {hoverInfo.id} • {hoverInfo.status}
        </div>
      )}
    </div>
  )
}
