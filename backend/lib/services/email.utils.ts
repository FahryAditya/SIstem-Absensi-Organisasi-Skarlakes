export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateCSVFromLogs(logs: any[]): string {
  const headers = ['Tanggal', 'Penerima', 'Email', 'Organisasi', 'Tipe', 'Status', 'Keterangan Error']
  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString('id-ID'),
    log.recipientName,
    log.recipientEmail,
    log.organizationType,
    log.emailType,
    log.status,
    log.error_message || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}
