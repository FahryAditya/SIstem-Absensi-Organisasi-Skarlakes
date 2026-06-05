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
    1: 'from-slate-400 to-slate-500 shadow-slate-200/50',
    2: 'from-blue-400 to-blue-500 shadow-blue-200/50',
    3: 'from-teal-400 to-teal-500 shadow-teal-200/50',
    4: 'from-persian-blue/100 to-persian-blue shadow-persian-blue/30/50',
    5: 'from-amber-500 to-amber-600 shadow-amber-200/50',
  }[level as 1 | 2 | 3 | 4 | 5] || 'from-slate-400 to-slate-500'

  return (
    <div className="w-full flex flex-col gap-1.5">
      {showLabels && (
        <div className="flex justify-between items-baseline text-xs font-semibold">
          <span className="text-[#001F3F] flex items-center gap-1">
            <span>Progress</span>
            <span className="text-[10px] font-mono bg-white/10 border border-white/10/60 text-slate-400 px-1.5 py-0.5 rounded">
              {Math.round(persen)}%
            </span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {isMaster ? (
              <span className="text-amber-600 font-bold">✨ Master {exp} EXP</span>
            ) : (
              <>
                <strong className="text-slate-200">{expSaatIni}</strong>
                <span className="text-slate-400"> / {expUntukLevel} EXP</span>
                <span className="text-slate-400 text-[10px] ml-1">
                  ({expUntukLevel - expSaatIni} EXP to Lvl {level + 1})
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-white/10 rounded-full border border-white/10/40 p-[1.5px] overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out shadow-sm`}
          style={{ width: `${persen}%` }}
        />
      </div>
    </div>
  )
}
