import React from 'react'
import { getExpProgress } from '@/lib/gamification'

interface ExpProgressBarProps {
  exp: number
  showLabels?: boolean
}

export function ExpProgressBar({ exp, showLabels = true }: ExpProgressBarProps) {
  const {
    level,
    levelName,
    expUntukLevel,
    expSaatIni,
    persen
  } = getExpProgress(exp)

  const isMaster = level >= 5

  // Gradient styles per level
  const gradientClass = {
    1: 'from-royal-400 to-royal-500 shadow-royal-200/50',
    2: 'from-royal-400 to-royal-500 shadow-royal-200/50',
    3: 'from-royal-400 to-royal-500 shadow-royal-200/50',
    4: 'from-royal-600 to-royal-700 shadow-royal-500/50',
    5: 'from-yellow-bright-500 to-yellow-bright-600 shadow-yellow-bright-200/50',
  }[level as 1 | 2 | 3 | 4 | 5] || 'from-royal-400 to-royal-500'

  return (
    <div className="w-full flex flex-col gap-1.5">
      {showLabels && (
        <div className="flex justify-between items-baseline text-xs font-semibold">
          <span className="text-white flex items-center gap-1">
            <span>Progress</span>
            <span className="text-[10px] font-mono bg-cream-50/10 border border-royal-800/30 text-royal-400 px-1.5 py-0.5 rounded">
              {Math.round(persen)}%
            </span>
          </span>
          <span className="font-mono text-[11px] text-royal-400">
            {isMaster ? (
              <span className="text-yellow-bright-600 font-bold">✨ Master {exp} EXP</span>
            ) : (
              <>
                <strong className="text-royal-200">{expSaatIni}</strong>
                <span className="text-royal-400"> / {expUntukLevel} EXP</span>
                <span className="text-royal-400 text-[10px] ml-1">
                  ({expUntukLevel - expSaatIni} EXP to Lvl {level + 1})
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-cream-50/10 rounded-full border border-royal-800/30 p-[1.5px] overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out shadow-sm`}
          style={{ width: `${persen}%` }}
        />
      </div>
    </div>
  )
}
