import * as XLSX from 'xlsx'

export interface ImportMemberRow {
  nama: string
  kelas: string
  nis?: string
  jabatan: string
  email: string
}

export interface ImportValidationError {
  row: number
  field: string
  value: any
  error: string
}

export function parseExcelFile(buffer: Buffer): {
  data: ImportMemberRow[]
  errors: ImportValidationError[]
} {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet)

    const data: ImportMemberRow[] = []
    const errors: ImportValidationError[] = []

    rows.forEach((row: any, index: number) => {
      const rowIndex = index + 2 // +2 because header is at row 1, index is 0-indexed

      // Get values tolerating various header cases
      const rawNama = row.nama || row.Nama || row.NAMA || row['Nama Lengkap'] || row['nama lengkap']
      const rawKelas = row.kelas || row.Kelas || row.KELAS
      const rawNis = row.nis || row.Nis || row.NIS || row.no_induk || row.NoInduk
      const rawJabatan = row.jabatan || row.Jabatan || row.JABATAN || row.posisi || row.Posisi
      const rawEmail = row.gmail || row.Gmail || row.GMAIL || row.email || row.Email || row.EMAIL

      // Validate nama
      if (!rawNama || typeof rawNama !== 'string' || rawNama.trim() === '') {
        errors.push({
          row: rowIndex,
          field: 'nama',
          value: rawNama,
          error: 'Nama wajib diisi',
        })
      }

      // Validate kelas
      if (!rawKelas || (typeof rawKelas !== 'string' && typeof rawKelas !== 'number')) {
        errors.push({
          row: rowIndex,
          field: 'kelas',
          value: rawKelas,
          error: 'Kelas wajib diisi',
        })
      }

      // Validate jabatan
      if (!rawJabatan || typeof rawJabatan !== 'string' || rawJabatan.trim() === '') {
        errors.push({
          row: rowIndex,
          field: 'jabatan',
          value: rawJabatan,
          error: 'Jabatan wajib diisi',
        })
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const emailStr = rawEmail ? String(rawEmail).trim().toLowerCase() : ''
      if (!emailStr || !emailRegex.test(emailStr)) {
        errors.push({
          row: rowIndex,
          field: 'email',
          value: rawEmail,
          error: 'Email tidak valid (harus format email yang benar)',
        })
      }

      // If no validation errors in this row, add to result data list
      if (!errors.some((e) => e.row === rowIndex)) {
        data.push({
          nama: String(rawNama).trim(),
          kelas: String(rawKelas).trim(),
          nis: rawNis ? String(rawNis).trim() : undefined,
          jabatan: String(rawJabatan).trim(),
          email: emailStr,
        })
      }
    })

    return { data, errors }
  } catch (error) {
    throw new Error(`Gagal parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
