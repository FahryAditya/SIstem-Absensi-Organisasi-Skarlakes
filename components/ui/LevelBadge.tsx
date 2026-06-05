import React from 'react'
import { getLevel, getLevelName } from '@/lib/gamification'
import { Award, ShieldAlert, Star, Zap, Trophy, Crown } from 'lucide-react'

interface LevelBadgeProps {
  exp: number
  size?: 'sm' | 'md' | 'lg'
}

export function LevelBadge({ exp, size = 'md' }: LevelBadgeProps) {
  const level = getLevel(exp)
  const tierName = getLevelName(level)

  // Curated premium color schemes
  const tierStyles = {
    1: {
      bg: 'bg-white/5 border-white/10 text-slate-200 shadow-slate-100/50',
      icon: <Award className="w-3.5 h-3.5 text-slate-400 fill-slate-200" />,
      gradient: 'from-slate-400 to-slate-500',
    },
    2: {
      bg: 'bg-white/5 border-white/10 text-blue-300 shadow-blue-100/50',
      icon: <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-300" />,
      gradient: 'from-blue-400 to-blue-500',
    },
    3: {
      bg: 'bg-teal-50 border-teal-200 text-teal-700 shadow-teal-100/50',
      icon: <Zap className="w-3.5 h-3.5 text-teal-500 fill-teal-300" />,
      gradient: 'from-teal-400 to-teal-500',
    },
    4: {
      bg: 'bg-persian-blue/10 border-persian-blue/30 text-blue-300 shadow-persian-blue/20/50',
      icon: <Trophy className="w-3.5 h-3.5 text-persian-blue/100 fill-blue-300" />,
      gradient: 'from-persian-blue/100 to-persian-blue',
    },
    5: {
      bg: 'bg-amber-500/10 border-white/10 text-amber-400 shadow-amber-100/50 animate-pulse',
      icon: <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-300" />,
      gradient: 'from-amber-500 to-amber-600',
    },
  }[level as 1 | 2 | 3 | 4 | 5] || {
    bg: 'bg-white/5 border-white/10 text-slate-200 shadow-slate-100/50',
    icon: <Award className="w-3.5 h-3.5 text-slate-400 fill-slate-200" />,
    gradient: 'from-slate-400 to-slate-500',
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded-full border shadow-sm ${tierStyles.bg}`}>
        {tierStyles.icon}
        <span>Lvl {level}</span>
      </span>
    )
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-md bg-gradient-to-br from-white to-slate-50 border-opacity-70 ${tierStyles.bg}`}>
          <div className={`absolute -top-2.5 -right-2 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full text-white bg-gradient-to-r ${tierStyles.gradient} shadow-sm tracking-wider`}>
            Lvl {level}
          </div>
          {React.cloneElement(tierStyles.icon as React.ReactElement, { className: 'w-8 h-8' })}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">LEVEL {level}</span>
          <span className="text-sm font-black text-white tracking-tight mt-1">{tierName}</span>
        </div>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-xl border shadow-sm tracking-wide ${tierStyles.bg}`}>
      {tierStyles.icon}
      <span>Lv {level} • {tierName}</span>
    </span>
  )
}
