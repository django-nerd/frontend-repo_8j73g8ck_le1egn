import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText } from 'lucide-react'

const generateChunks = (size = 5) => Array.from({ length: size }, (_, i) => i)

export default function DataBreakdown({ running, speed = 1 }) {
  const [cycle, setCycle] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => setCycle((c) => c + 1), Math.max(600 / speed, 200))
    return () => clearInterval(timerRef.current)
  }, [running, speed])

  const chunks = useMemo(() => generateChunks(5), [])

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Input Data</span>
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100">DATA</span>
        </div>
      </div>

      <div className="relative mt-4 h-14 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={cycle}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 / speed }}
            className="flex items-center justify-center gap-2"
          >
            {chunks.map((c) => (
              <motion.div
                key={c}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 / speed, delay: (c * 0.05) / speed }}
                className="px-3 py-2 rounded-md bg-white shadow-sm border text-gray-700 text-sm"
                title={`Packet ${c}`}
              >
                {c}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-gray-600 mt-1">TCP breaks data into smaller packets</p>
    </div>
  )
}
