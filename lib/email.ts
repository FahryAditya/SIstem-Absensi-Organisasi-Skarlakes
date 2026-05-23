export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`)
  console.log(`[EMAIL BODY]:\n${html}\n-----------------------------------`)
  return true
}

export async function sendLevelUpEmail(studentName: string, email: string, level: number, levelName: string) {
  const subject = `Selamat ${studentName}, Kamu Naik ke Level ${level}! 🎉`
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #052659;">Selamat Kamu Naik Level! 🚀</h2>
      <p>Halo <strong>${studentName}</strong>,</p>
      <p>Kerja keras dan keaktifanmu membuahkan hasil! Kamu telah berhasil naik ke:</p>
      <div style="background: linear-gradient(135deg, #052659, #5482B4); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; display: block;">Level ${level}</span>
        <span style="font-size: 16px; opacity: 0.9;">Tier: ${levelName}</span>
      </div>
      <p>Terus tingkatkan keaktifanmu dalam kegiatan organisasi dan kumpulkan terus EXP untuk mencapai level tertinggi!</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #7EA0C5;">Sistem Absensi Skarlakes Gamification</p>
    </div>
  `
  return sendEmail({ to: email || 'siswa@skarlakes.sch.id', subject, html })
}

export async function sendAchievementEmail(studentName: string, email: string, achievementName: string, icon: string, description: string, expReward: number) {
  const subject = `Kamu Mendapat Pencapaian Baru: [${achievementName}]! 🏆`
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #052659;">Pencapaian Baru Terbuka! 🏆</h2>
      <p>Halo <strong>${studentName}</strong>,</p>
      <p>Selamat! Admin telah memberikan pencapaian baru untukmu atas kontribusi atau prestasimu:</p>
      <div style="background-color: #F0F4F8; border-left: 4px solid #5482B4; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <span style="font-size: 30px; float: left; margin-right: 15px;">${getEmojiForIcon(icon)}</span>
        <strong style="font-size: 18px; color: #011025; display: block;">${achievementName}</strong>
        <span style="font-size: 14px; color: #555; display: block; margin-top: 5px;">${description}</span>
        <span style="font-size: 12px; font-weight: bold; color: #2e7d32; display: block; margin-top: 10px;">🎁 +${expReward} EXP Reward</span>
      </div>
      <p>Terima kasih atas kontribusi terbaikmu. Tetap semangat dan jadilah yang terbaik!</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #7EA0C5;">Sistem Absensi Skarlakes Gamification</p>
    </div>
  `
  return sendEmail({ to: email || 'siswa@skarlakes.sch.id', subject, html })
}

function getEmojiForIcon(iconName: string): string {
  const mapping: Record<string, string> = {
    trophy: '🏆',
    star: '⭐',
    workspace_premium: '🥇',
    school: '🎓',
    code: '💻',
    translate: '🗣️',
    military_tech: '🎖️',
    local_fire_department: '🔥',
    group: '👥',
    emoji_events: '🎗️'
  }
  return mapping[iconName.toLowerCase()] || '✨'
}
