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
      bg: 'bg-royal-900/50 border-royal-800/30 text-royal-200 shadow-royal-100/50',
      icon: <Award className="w-3.5 h-3.5 text-royal-400 fill-royal-200" />,
      gradient: 'from-royal-400 to-royal-500',
    },
    2: {
      bg: 'bg-royal-900/50 border-royal-800/30 text-royal-300 shadow-royal-100/50',
      icon: <Star className="w-3.5 h-3.5 text-royal-500 fill-royal-300" />,
      gradient: 'from-royal-400 to-royal-500',
    },
    3: {
      bg: 'bg-cream-50 border-royal-200 text-royal-700 shadow-royal-100/50',
      icon: <Zap className="w-3.5 h-3.5 text-royal-500 fill-royal-300" />,
      gradient: 'from-royal-400 to-royal-500',
    },
    4: {
      bg: 'bg-royal-600/10 border-royal-500/30 text-royal-300 shadow-royal-500/50',
      icon: <Trophy className="w-3.5 h-3.5 text-royal-500 fill-royal-300" />,
      gradient: 'from-royal-600 to-royal-700',
    },
    5: {
      bg: 'bg-yellow-bright-500/10 border-royal-800/30 text-yellow-bright-400 shadow-yellow-bright-100/50 animate-pulse',
      icon: <Crown className="w-3.5 h-3.5 text-yellow-bright-500 fill-yellow-bright-300" />,
      gradient: 'from-yellow-bright-500 to-yellow-bright-600',
    },
  }[level as 1 | 2 | 3 | 4 | 5] || {
    bg: 'bg-royal-900/50 border-royal-800/30 text-royal-200 shadow-royal-100/50',
    icon: <Award className="w-3.5 h-3.5 text-royal-400 fill-royal-200" />,
    gradient: 'from-royal-400 to-royal-500',
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
        <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-md bg-gradient-to-br from-white to-cream-50 border-opacity-70 ${tierStyles.bg}`}>
          <div className={`absolute -top-2.5 -right-2 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full text-white bg-gradient-to-r ${tierStyles.gradient} shadow-sm tracking-wider`}>
            Lvl {level}
          </div>
          {React.cloneElement(tierStyles.icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-royal-400 uppercase tracking-widest leading-none">LEVEL {level}</span>
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
