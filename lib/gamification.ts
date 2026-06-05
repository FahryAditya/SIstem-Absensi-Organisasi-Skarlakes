export const LEVEL_THRESHOLDS = [0, 150, 350, 600, 900]
export const LEVEL_NAMES = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master']
export const EXP_PER_LEVEL = [150, 200, 250, 300]

export function getLevel(exp: number): number {
  if (exp < 150) return 1
  if (exp < 350) return 2
  if (exp < 600) return 3
  if (exp < 900) return 4
  return 5
}

export function getLevelName(level: number): string {
  if (level === 1) return 'Beginner'
  if (level === 2) return 'Intermediate'
  if (level === 3) return 'Advanced'
  if (level === 4) return 'Expert'
  return 'Master'
}

export function getLevelColor(level: number): string {
  switch (level) {
    case 1: return 'from-slate-400 to-slate-500 text-white bg-white/5'
    case 2: return 'from-blue-400 to-blue-500 text-blue-800 bg-blue-50'
    case 3: return 'from-teal-400 to-teal-500 text-teal-800 bg-teal-50'
    case 4: return 'from-persian-blue/100 to-persian-blue text-blue-200 bg-persian-blue/10'
    case 5: return 'from-amber-500 to-amber-600 text-amber-800 bg-amber-50'
    default: return 'from-slate-400 to-slate-500 text-white bg-white/5'
  }
}

export function getExpProgress(exp: number) {
  const level = getLevel(exp)
  if (level >= 5) {
    return {
      level,
      levelName: 'Master',
      startThreshold: 900,
      expUntukLevel: 300, // keep 300 as base
      expSaatIni: Math.max(0, exp - 900),
      persen: 100
    }
  }

  const levelStarts = [0, 150, 350, 600]
  const expUntukLevel = EXP_PER_LEVEL[level - 1]
  const startThreshold = levelStarts[level - 1]
  const expSaatIni = Math.max(0, exp - startThreshold)
  const persen = Math.min((expSaatIni / expUntukLevel) * 100, 100)

  return {
    level,
    levelName: getLevelName(level),
    startThreshold,
    expUntukLevel,
    expSaatIni,
    persen
  }
}
