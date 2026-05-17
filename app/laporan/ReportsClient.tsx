'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  Loader2, 
  RefreshCw, 
  ShieldAlert, 
  RefreshCcwDot,
  FileSpreadsheet,
  Printer
} from 'lucide-react'
import AttendanceCharts from '@/components/charts/AttendanceCharts'
import FinanceCharts from '@/components/charts/FinanceCharts'
import KasSiswaCharts from '@/components/charts/KasSiswaCharts'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface Props {
  user: { id: number; nama: string; email: string; role: string }
}

const formatDate = (date: Date, formatStr: string) => {
  return format(date, formatStr, { locale: id })
}

const formatRupiah = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
]

// Generate a wide range of years dynamically (from 2020 up to 15 years in the future)
const generateYearsList = () => {
  const currentYear = new Date().getFullYear()
  const startYear = 2020
  const endYear = currentYear + 15
  const years = []
  for (let y = startYear; y <= endYear; y++) {
    years.push({ value: y, label: `Tahun ${y}` })
  }
  return years
}

// Convert month-year string (e.g. "Des 2025") into object for precise year/month filters
const parseMonthYearObject = (monthYearStr: string) => {
  if (!monthYearStr) return { year: 0, monthNum: 0 }
  const parts = monthYearStr.trim().split(' ')
  if (parts.length < 2) return { year: 0, monthNum: 0 }
  const monthName = parts[0].toLowerCase()
  const year = parseInt(parts[1]) || 0
  
  const monthMap: Record<string, number> = {
    des: 12, dec: 12, nov: 11, okt: 10, oct: 10, sep: 9, sept: 9,
    agu: 8, agust: 8, ags: 8, jul: 7, juli: 7, jun: 6, juni: 6,
    mei: 5, may: 5, apr: 4, april: 4, mar: 3, maret: 3, feb: 2, febr: 2,
    jan: 1
  }
  
  let monthNum = 1
  for (const key in monthMap) {
    if (monthName.startsWith(key)) {
      monthNum = monthMap[key]
      break
    }
  }
  return { year, monthNum }
}

// Convert image url to base64 securely on client-side
const loadBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('Failed to get canvas context'))
      }
    }
    img.onerror = () => reject(new Error('Failed to load image: ' + url))
    img.src = url
  })
}

// PREMIUM CUSTOM ARTEMIS DROPDOWN SELECTOR
interface CoolSelectProps {
  value: any
  onChange: (val: any) => void
  options: { value: any; label: string }[]
  labelPrefix?: string
}

function CoolSelect({ value, onChange, options, labelPrefix = '' }: CoolSelectProps) {
  const [open, setOpen] = useState(false)
  const activeOption = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    if (!open) return
    const handleOutsideClick = () => setOpen(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [open])

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-800/90 border border-slate-700/50 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all shadow-sm focus:outline-none"
      >
        <span>{labelPrefix}{activeOption?.label}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-down">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-all duration-150 flex items-center justify-between ${
                  opt.value === value
                    ? 'bg-[#5482B4] text-white font-extrabold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportsClient({ user }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'attendance' | 'finance' | 'kas'>('attendance')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  
  // Date range filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [startMonthNum, setStartMonthNum] = useState<number>(1) // default Januari
  const [endMonthNum, setEndMonthNum] = useState<number>(12) // default Desember

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    setAuthError(false)
    setServerError(null)
    try {
      const res = await fetch('/api/reports?type=all')
      
      if (res.status === 401) {
        setAuthError(true)
        setLoading(false)
        return
      }

      const json = await res.json().catch(() => ({ error: 'Gagal membaca respon server' }))

      if (!res.ok) {
        setServerError(json?.error || `Error ${res.status}: Terjadi kesalahan pada server`)
        setLoading(false)
        return
      }
      
      setData(json)
    } catch (err) {
      console.error('Failed to fetch reports data:', err)
      setServerError('Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  // Automatically initialize month filters when data is fetched
  useEffect(() => {
    if (data?.keuanganBulanan && data.keuanganBulanan.length > 0) {
      setSelectedYear(new Date().getFullYear()) // Default to current year
      setStartMonthNum(1) // Default to Januari
      setEndMonthNum(12) // Default to Desember
    }
  }, [data])

  // PDF Export Generation
  const handleExportPDF = async () => {
    if (!data) {
      toast.error('Data laporan belum siap. Silakan refresh terlebih dahulu.')
      return
    }
    setExportingPdf(true)
    const toastId = toast.loading('Mengunduh logo & menyiapkan dokumen laporan resmi (PDF)...')
    
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Image resources
      const logoAirlanggaUrl = 'https://uploads.onecompiler.io/43k3cj6jv/44ph8dpc9/Logo-smk-airlangga-balikpapan2-1.png'
      const logoKesUrl = 'https://uploads.onecompiler.io/43k3cj6jv/44ph8dpc9/LOGO_SMK_KES_.png'

      const [logoAirlanggaBase64, logoKesBase64] = await Promise.all([
        loadBase64Image(logoAirlanggaUrl).catch((err) => {
          console.warn('Failed to load SMK Airlangga logo', err)
          return ''
        }),
        loadBase64Image(logoKesUrl).catch((err) => {
          console.warn('Failed to SMK Kes logo', err)
          return ''
        })
      ])

      let currentY = 12

      // ── DRAW KOP SURAT (OFFICIAL LETTERHEAD) ───────────────────
      // Left Logo: SMK Airlangga Balikpapan
      if (logoAirlanggaBase64) {
        doc.addImage(logoAirlanggaBase64, 'PNG', 15, currentY, 20, 20)
      }

      // Right Logo: SMK Kesehatan Airlangga Balikpapan
      if (logoKesBase64) {
        doc.addImage(logoKesBase64, 'PNG', 175, currentY, 20, 20)
      }

      // Center Official Texts
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(5, 38, 89) // #052659 - Corporate Premium Blue
      doc.text('YAYASAN AIRLANGGA BALIKPAPAN', 105, currentY + 3, { align: 'center' })
      
      doc.setFontSize(11)
      doc.setTextColor(5, 38, 89)
      doc.text('SMK AIRLANGGA & SMK KESEHATAN AIRLANGGA', 105, currentY + 8, { align: 'center' })
      
      doc.setFont('Helvetica', 'oblique')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 100, 100)
      doc.text('Terakreditasi A • Bidang Keahlian: Teknologi, Bisnis, Kesehatan & Farmasi', 105, currentY + 13, { align: 'center' })
      
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(110, 110, 110)
      doc.text('Jl. S. Parman No. 27, Gunung Sari Ulu, Balikpapan Tengah, Kota Balikpapan 76122 • Telp: (0542) 732103', 105, currentY + 17, { align: 'center' })

      // Double Line Divider
      currentY += 21
      doc.setLineWidth(0.8)
      doc.setDrawColor(5, 38, 89)
      doc.line(15, currentY, 195, currentY)
      doc.setLineWidth(0.2)
      doc.line(15, currentY + 0.8, 195, currentY + 0.8)

      // ── REPORT TITLE & PERIOD ──────────────────────────────────
      currentY += 10
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42) // Slate 900
      doc.text('LAPORAN DATA KINERJA & KEUANGAN EKSTRAKURIKULER', 105, currentY, { align: 'center' })
      
      const startMonthLabel = MONTH_OPTIONS.find(m => m.value === startMonthNum)?.label || ''
      const endMonthLabel = MONTH_OPTIONS.find(m => m.value === endMonthNum)?.label || ''

      currentY += 5
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(5, 38, 89)
      doc.text(`Periode: ${startMonthLabel} s/d ${endMonthLabel} ${selectedYear}`, 105, currentY, { align: 'center' })

      // Metadata Info Box
      currentY += 8
      doc.setFillColor(248, 250, 252) // Slate 50
      doc.setDrawColor(226, 232, 240) // Slate 200
      doc.roundedRect(15, currentY, 180, 18, 2, 2, 'FD')

      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(5, 38, 89)
      doc.text('INFORMASI LAPORAN', 20, currentY + 5.5)
      
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(`Cetak Oleh   : ${user.nama} (${user.role === 'administrator' ? 'Administrator' : 'Pembina'})`, 20, currentY + 10.5)
      doc.text(`Tanggal Cetak: ${formatDate(new Date(), 'dd MMMM yyyy HH:mm')} WITA`, 20, currentY + 14.5)
      
      doc.text(`Akses Data : ${data.orgs.map((o: string) => o.toUpperCase()).join(', ')}`, 110, currentY + 10.5)
      doc.text(`Dokumen    : 100% Client-Side Automated (Artemis)`, 110, currentY + 14.5)

      // ── SECTION 1: KEHADIRAN ANGOTA TAHUNAN ────────────────────
      currentY += 25
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(5, 38, 89)
      doc.text('1. Laporan Statistik Kehadiran Bulanan', 15, currentY)

      // Filter attendance records based on selectedYear, startMonthNum, and endMonthNum
      const filteredAttendance = (data.kehadiranTahunan || []).filter((item: any) => {
        const parsed = parseMonthYearObject(`${item.month} ${selectedYear}`)
        if (parsed.year === selectedYear) {
          return parsed.monthNum >= startMonthNum && parsed.monthNum <= endMonthNum
        }
        return false
      })

      const attendanceRows = filteredAttendance.map((item: any) => [
        item.month,
        `${item.hadir} Sesi`,
        `${item.tidak_hadir} Sesi`,
        `${item.persentase}%`
      ])

      currentY += 3.5
      autoTable(doc, {
        startY: currentY,
        head: [['Bulan', 'Total Kehadiran (Hadir)', 'Total Absen (Sakit/Izin/Alfa)', 'Tingkat Kehadiran']],
        body: attendanceRows,
        theme: 'striped',
        headStyles: { fillColor: [5, 38, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        margin: { left: 15, right: 15 }
      })

      // Update Y Position
      currentY = (doc as any).lastAutoTable.finalY + 10

      if (currentY > 210) {
        doc.addPage()
        currentY = 20
      }

      // ── SECTION 2: BUKU KAS KEUANGAN ──────────────────────────
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(5, 38, 89)
      doc.text('2. Laporan Transaksi Rincian Keuangan Buku Kas', 15, currentY)

      // Filter finance records based on selectedYear, startMonthNum, and endMonthNum
      const filteredFinance = (data.keuanganBulanan || []).filter((item: any) => {
        const parsed = parseMonthYearObject(item.bulan)
        if (parsed.year === selectedYear) {
          return parsed.monthNum >= startMonthNum && parsed.monthNum <= endMonthNum
        }
        return false
      })

      const financeRows = filteredFinance.map((item: any) => [
        item.bulan,
        formatRupiah(item.pemasukan),
        formatRupiah(item.pengeluaran),
        formatRupiah(item.saldo)
      ])

      currentY += 3.5
      autoTable(doc, {
        startY: currentY,
        head: [['Bulan Periode', 'Pemasukan Kas', 'Pengeluaran Kas', 'Saldo Bersih Bulanan']],
        body: financeRows,
        theme: 'striped',
        headStyles: { fillColor: [84, 130, 180], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        margin: { left: 15, right: 15 }
      })

      currentY = (doc as any).lastAutoTable.finalY + 10

      if (currentY > 200) {
        doc.addPage()
        currentY = 25
      }

      // ── SECTION 3: TOP KAS CONTRIBUTORS ────────────────────────
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(5, 38, 89)
      doc.text('3. Rangkuman Anggota Teraktif & Pembayar Kas Teladan', 15, currentY)

      const allTopStudents = [
        ...(data.kasSiswa?.programming || []),
        ...(data.kasSiswa?.english || []),
        ...(data.kasSiswa?.osis || []),
        ...(data.kasSiswa?.mpk || [])
      ].slice(0, 5) // Top 5 members

      const memberRows = allTopStudents.map((item: any, idx: number) => [
        String(idx + 1),
        item.nama,
        item.kelas,
        item.organisasi,
        formatRupiah(item.total_kas)
      ])

      currentY += 3.5
      if (memberRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['No', 'Nama Lengkap Anggota', 'Kelas / Jabatan', 'Unit Organisasi', 'Total Kas Terbayar']],
          body: memberRows,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
          bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
          alternateRowStyles: { fillColor: [248, 250, 253] },
          margin: { left: 15, right: 15 }
        })
      } else {
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(9)
        doc.text('Belum ada data kontribusi anggota terdaftar.', 15, currentY + 6)
      }

      // Note: Tanda tangan resmi pembina dan kepala sekolah dihapus sesuai permintaan user.

      // Save PDF document
      doc.save(`Laporan_Resmi_Airlangga_${startMonthLabel}_s.d_${endMonthLabel}_${selectedYear}.pdf`)
      toast.success('Laporan PDF Resmi berhasil diterbitkan! 📄🎉', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error('Gagal memproses PDF: ' + err.message, { id: toastId })
    }
    setExportingPdf(false)
  }

  // Excel Export Generation
  const handleExportExcel = () => {
    if (!data) {
      toast.error('Data laporan belum siap. Silakan refresh terlebih dahulu.')
      return
    }
    setExportingExcel(true)
    const toastId = toast.loading('Menyiapkan dan menyusun Laporan Excel (XLSX)...')

    try {
      // 1. Sheet 1: Kehadiran Tahunan (Filtered)
      const filteredAttendance = (data.kehadiranTahunan || []).filter((item: any) => {
        const parsed = parseMonthYearObject(`${item.month} ${selectedYear}`)
        if (parsed.year === selectedYear) {
          return parsed.monthNum >= startMonthNum && parsed.monthNum <= endMonthNum
        }
        return false
      })

      const attendanceData = filteredAttendance.map((item: any) => ({
        'Bulan': item.month,
        'Hadir (Sesi)': item.hadir,
        'Absen / Tidak Hadir (Sesi)': item.tidak_hadir,
        'Persentase Tingkat Kehadiran': `${item.persentase}%`
      }))

      // 2. Sheet 2: Buku Kas Keuangan (Filtered)
      const filteredFinance = (data.keuanganBulanan || []).filter((item: any) => {
        const parsed = parseMonthYearObject(item.bulan)
        if (parsed.year === selectedYear) {
          return parsed.monthNum >= startMonthNum && parsed.monthNum <= endMonthNum
        }
        return false
      })

      const financeData = filteredFinance.map((item: any) => ({
        'Bulan Periode': item.bulan,
        'Pemasukan (Rp)': item.pemasukan,
        'Pengeluaran (Rp)': item.pengeluaran,
        'Saldo Bersih (Rp)': item.saldo
      }))

      // 3. Sheet 3: Kas Anggota Ekskul
      const allTopStudents = [
        ...(data.kasSiswa?.programming || []),
        ...(data.kasSiswa?.english || []),
        ...(data.kasSiswa?.osis || []),
        ...(data.kasSiswa?.mpk || [])
      ]
      
      const memberData = allTopStudents.map((item: any) => ({
        'Nama Lengkap Anggota': item.nama,
        'Kelas / Jabatan': item.kelas,
        'Unit Organisasi': item.organisasi,
        'Total Kas Terbayar (Rp)': item.total_kas
      }))

      // Construct workbook
      const wb = XLSX.utils.book_new()

      const wsAttendance = XLSX.utils.json_to_sheet(attendanceData)
      XLSX.utils.book_append_sheet(wb, wsAttendance, 'Laporan Kehadiran')

      const wsFinance = XLSX.utils.json_to_sheet(financeData)
      XLSX.utils.book_append_sheet(wb, wsFinance, 'Laporan Buku Kas')

      const wsMembers = XLSX.utils.json_to_sheet(memberData)
      XLSX.utils.book_append_sheet(wb, wsMembers, 'Data Kas Anggota')

      // Save XLSX file to downloads
      XLSX.writeFile(wb, `Laporan_Ekskul_Airlangga_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`)
      toast.success('Laporan Excel (XLSX) berhasil diunduh! 📊🎉', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error('Gagal memproses Excel: ' + err.message, { id: toastId })
    }
    setExportingExcel(false)
  }

  // Construct Dynamic Years for selector (unlimited dynamic range)
  const availableYears = generateYearsList()

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#5482B4]" />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Statistik</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Kompilasi dan visualisasi data kehadiran, keuangan, dan kas siswa terintegrasi.</p>
        </div>

        {/* Action Export & Futuristic Cool Filters Panel */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Custom Cool Select Dropdown period pickers */}
          {data?.keuanganBulanan && data.keuanganBulanan.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/50 border border-slate-200/80 px-3 py-2 rounded-2xl transition-all">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider hidden sm:inline">Periode:</span>
              
              {/* Cool Select Year */}
              <CoolSelect 
                value={selectedYear} 
                onChange={(val) => setSelectedYear(val)} 
                options={availableYears} 
              />
              
              <span className="text-slate-400 text-xs font-black">·</span>

              {/* Cool Select Start Month */}
              <CoolSelect 
                value={startMonthNum} 
                onChange={(val) => setStartMonthNum(val)} 
                options={MONTH_OPTIONS} 
                labelPrefix="Mulai: "
              />
              
              <span className="text-slate-400 text-xs font-bold">s/d</span>

              {/* Cool Select End Month */}
              <CoolSelect 
                value={endMonthNum} 
                onChange={(val) => setEndMonthNum(val)} 
                options={MONTH_OPTIONS} 
                labelPrefix="Sampai: "
              />
            </div>
          )}

          <button
            onClick={handleExportPDF}
            disabled={loading || exportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Cetak PDF Resmi
          </button>
          
          <button
            onClick={handleExportExcel}
            disabled={loading || exportingExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Ekspor Excel
          </button>

          <button
            onClick={fetchReportsData}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-[#5482B4] text-white font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Kehadiran
          </button>
          <button
            onClick={() => {
              setActiveTab('finance')
              if (!data?.keuanganBulanan) fetchReportsData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'finance'
                ? 'bg-[#5482B4] text-white font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Keuangan
          </button>
          <button
            onClick={() => {
              setActiveTab('kas')
              if (!data?.kasSiswa) fetchReportsData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'kas'
                ? 'bg-[#5482B4] text-white font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Kas Siswa
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#5482B4] mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat laporan...</p>
          </div>
        </div>
      ) : authError ? (
        <div className="card p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700 mb-1">Sesi habis atau akses ditolak</p>
          <p className="text-sm text-slate-500 mb-4">Silakan login ulang untuk melanjutkan.</p>
          <button
            onClick={() => { window.location.href = '/login' }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCcwDot className="w-4 h-4" />
            Login Ulang
          </button>
        </div>
      ) : serverError ? (
        <div className="card p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700 mb-1">Gagal Memuat Data</p>
          <p className="text-sm text-slate-500 mb-4">{serverError}</p>
          <button
            onClick={fetchReportsData}
            className="btn-primary inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      ) : data ? (
        <>
          {activeTab === 'attendance' && <AttendanceCharts data={data} />}
          {activeTab === 'finance' && <FinanceCharts data={data} />}
          {activeTab === 'kas' && <KasSiswaCharts data={data} />}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-sm text-slate-500">Tidak ada data untuk ditampilkan</p>
        </div>
      )}
    </div>
  )
}
