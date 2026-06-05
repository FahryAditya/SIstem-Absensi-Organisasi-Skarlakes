'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import {
  X, UploadCloud, FileText, FileSpreadsheet, Loader2,
  Maximize2, Minimize2, ChevronLeft, ChevronRight, MonitorUp,
  Clock, RotateCcw, AlertCircle, ZoomIn, ZoomOut
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface FilePresentationModeProps {
  user: { nama: string; role: string }
}

/** Live Clock component inside presenter header */
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono tabular-nums text-white/80">
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

/** Render PDF Page using Canvas dynamically from CDN pdf.js worker */
function PdfSlideRenderer({ page, zoom }: { page: any; zoom: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    let renderTask: any = null
    const renderPage = async () => {
      if (!canvasRef.current) return
      setRendering(true)
      try {
        const pdfPage = await page.pdfDoc.getPage(page.pageNumber)
        
        // Dynamic pixel ratio scaling for crisp rendering
        const pixelRatio = window.devicePixelRatio || 1
        const viewport = pdfPage.getViewport({ scale: zoom * pixelRatio })
        
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width
        
        // Scale styling down so it matches exact requested size
        canvas.style.width = `${viewport.width / pixelRatio}px`
        canvas.style.height = `${viewport.height / pixelRatio}px`

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }
        renderTask = pdfPage.render(renderContext)
        await renderTask.promise
      } catch (err) {
        console.error('Render error:', err)
      } finally {
        setRendering(false)
      }
    }

    renderPage()
    return () => {
      if (renderTask) {
        renderTask.cancel()
      }
    }
  }, [page, zoom])

  return (
    <div className="relative flex items-center justify-center max-h-full max-w-full overflow-auto rounded-xl bg-slate-900/50 p-2 border border-white/5 shadow-2xl">
      {rendering && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2 rounded-xl backdrop-blur-xs z-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E90FF]" />
          <span className="text-sm font-semibold tracking-wide">Rendering Page...</span>
        </div>
      )}
      <canvas ref={canvasRef} className="object-contain max-h-[68vh] rounded-lg shadow-xl" />
    </div>
  )
}

export default function FilePresentationMode({ user }: FilePresentationModeProps) {
  const [open, setOpen] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  
  // Library loaded status
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Document slides states
  const [slides, setSlides] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fileType, setFileType] = useState<'pdf' | 'excel' | 'text' | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [zoom, setZoom] = useState(1.2) // PDF Zoom factor
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const now = new Date()

  useEffect(() => { setIsBrowser(true) }, [])

  // iOS-safe scroll locking & layout viewport protection
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalWidth = document.body.style.width
    const originalHeight = document.body.style.height

    // Lock scroll to prevent rubber-banding on iOS Safari
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.width = originalWidth
      document.body.style.height = originalHeight
    }
  }, [open])

  // Load PDFJS CDN dynamically to keep production build lightweight & stable
  useEffect(() => {
    if (!open) return
    if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
      script.async = true
      script.onload = () => {
        ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
        setPdfjsLoaded(true)
      }
      document.body.appendChild(script)
    } else {
      setPdfjsLoaded(true)
    }
  }, [open])

  // Native Fullscreen listeners
  useEffect(() => {
    const onChange = () => setIsNativeFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleNativeFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!open || slides.length === 0) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSlide()
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          handleClose()
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleNativeFullscreen()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, slides, currentSlide])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    setOpen(false)
  }

  const resetPresentation = () => {
    setSlides([])
    setCurrentSlide(0)
    setFileType(null)
    setFileName('')
    setFileSize('')
    setZoom(1.2)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1))
  }

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))
  }

  // Handle file reading
  const processFile = async (file: File) => {
    if (!file) return
    setLoading(true)
    setFileName(file.name)
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB')

    const fileExt = file.name.split('.').pop()?.toLowerCase()

    try {
      if (fileExt === 'pdf') {
        if (!pdfjsLoaded || !(window as any).pdfjsLib) {
          throw new Error('PDF Engine belum siap loaded. Silakan tunggu 1-2 detik.')
        }

        const reader = new FileReader()
        reader.onload = async (ev) => {
          try {
            const arrayBuffer = ev.target?.result as ArrayBuffer
            const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const pages: any[] = []
            
            for (let i = 1; i <= pdf.numPages; i++) {
              pages.push({
                type: 'pdf',
                pageNumber: i,
                pdfDoc: pdf
              })
            }

            if (pages.length === 0) throw new Error('File PDF tidak memiliki halaman.')
            setSlides(pages)
            setFileType('pdf')
            setCurrentSlide(0)
            toast.success(`Berhasil memuat ${pages.length} Halaman PDF`)
          } catch (err: any) {
            toast.error('Gagal memproses PDF: ' + err.message)
            resetPresentation()
          } finally {
            setLoading(false)
          }
        }
        reader.readAsArrayBuffer(file)

      } else if (['xlsx', 'xls', 'csv'].includes(fileExt || '')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            const data = new Uint8Array(ev.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetSlides: any[] = []

            workbook.SheetNames.forEach((sheetName) => {
              const worksheet = workbook.Sheets[sheetName]
              // Get rows including empty cells cleanly
              const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
              if (json.length > 0) {
                sheetSlides.push({
                  type: 'excel',
                  sheetName,
                  data: json
                })
              }
            })

            if (sheetSlides.length === 0) throw new Error('File Excel tidak berisi data.')
            setSlides(sheetSlides)
            setFileType('excel')
            setCurrentSlide(0)
            toast.success(`Berhasil memuat ${sheetSlides.length} Sheet Excel`)
          } catch (err: any) {
            toast.error('Gagal memproses Excel: ' + err.message)
            resetPresentation()
          } finally {
            setLoading(false)
          }
        }
        reader.readAsArrayBuffer(file)

      } else if (['txt', 'md'].includes(fileExt || '')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            const text = ev.target?.result as string
            // Split slides by "---" marker (Marp standard)
            const rawSlides = text.split(/---/g)
            
            const parsedSlides = rawSlides.map((slideText, index) => {
              const lines = slideText.split('\n').map(l => l.trim()).filter(Boolean)
              // First heading # is slide title
              const headingIdx = lines.findIndex(l => l.startsWith('#'))
              const title = headingIdx !== -1 ? lines[headingIdx].replace(/^#+\s*/, '') : `Slide ${index + 1}`
              
              // Non-heading lines are bullet list items
              const content = lines.filter((l, idx) => idx !== headingIdx && !l.startsWith('---'))
                .map(l => l.replace(/^[-*+]\s*/, '')) // clean bullet marks

              return {
                type: 'text',
                title,
                content
              }
            }).filter(s => s.content.length > 0 || s.title)

            if (parsedSlides.length === 0) throw new Error('Teks tidak terstruktur atau kosong.')
            setSlides(parsedSlides)
            setFileType('text')
            setCurrentSlide(0)
            toast.success(`Berhasil memuat ${parsedSlides.length} Slide Teks`)
          } catch (err: any) {
            toast.error('Gagal memproses file teks: ' + err.message)
            resetPresentation()
          } finally {
            setLoading(false)
          }
        }
        reader.readAsText(file)

      } else {
        throw new Error('Format file tidak didukung. Pilih PDF, Excel (.xlsx/.xls/.csv), atau Teks/Markdown (.txt/.md).')
      }
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <>
      {/* Trigger Button next to regular presentation button */}
      <button
        id="btn-file-presentation-mode"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl
          bg-[#1E90FF] text-white shadow-lg shadow-[#1E90FF]/20
          hover:bg-[#001F3F] hover:shadow-xl hover:shadow-[#1E90FF]/30
          hover:-translate-y-0.5 active:scale-95
          transition-all duration-200 border border-white/10"
        title="Presentasikan File PDF / Excel / Teks langsung di layar proyektor"
      >
        <MonitorUp className="w-4 h-4" />
        <span className="hidden sm:inline">Presentasi File</span>
        <span className="text-[10px] font-black bg-white/25 px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">
          Client
        </span>
      </button>

      {/* Presentation Fullscreen Portal Overlay */}
      {isBrowser && open && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex flex-col presentation-enter select-none"
          style={{
            background: 'linear-gradient(135deg, #001F3F 0%, #021435 50%, #001F3F 100%)',
          }}
        >
          {/* Subtle grid mesh background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Glowing layout bubbles */}
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none bg-blue-500/10 blur-[80px]" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full pointer-events-none bg-cyan-500/5 blur-[80px]" />

          {/* HEADER */}
          <div className="relative flex items-center justify-between px-4 md:px-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 md:py-4 border-b border-white/10 flex-shrink-0 z-20">
            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#1E90FF] animate-pulse shadow-lg shadow-blue-500/50" />
              <span className="text-white/60 text-xs md:text-sm font-semibold tracking-wide uppercase">
                <span className="hidden xs:inline">Presentasi</span> File
              </span>
              {fileName && (
                <>
                  <span className="text-white/30 text-sm">·</span>
                  <span className="text-[#1E90FF] text-[10px] md:text-xs font-bold bg-[#1E90FF]/20 border border-[#1E90FF]/30 px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg max-w-[80px] sm:max-w-[200px] truncate" title={fileName}>
                    📄 {fileName}
                  </span>
                </>
              )}
            </div>

            {/* Central Badge (No Database Notice) */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center hidden md:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-sm">
                🔒 Private 100% Client-Side
              </span>
              <p className="text-[10px] text-white/35 mt-0.5 font-medium">
                Data tidak terkirim & tidak disimpan ke database
              </p>
            </div>

            <div className="flex items-center gap-1.5 md:gap-3">
              {/* PDF Zoom controls */}
              {fileType === 'pdf' && (
                <div className="flex items-center gap-0.5 md:gap-1 bg-white/5 border border-white/10 rounded-xl px-1 py-0.5">
                  <button onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} className="p-1 md:p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors" title="Zoom Out">
                    <ZoomOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                  <span className="text-white/70 text-[10px] md:text-xs font-mono font-bold px-1">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={() => setZoom(z => Math.min(2.4, z + 0.2))} className="p-1 md:p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors" title="Zoom In">
                    <ZoomIn className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                </div>
              )}

              {/* Time display (desktop only) */}
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm">
                <Clock className="w-3.5 h-3.5 text-white/50 animate-pulse" />
                <LiveClock />
              </div>

              {/* Fullscreen control */}
              <button
                onClick={toggleNativeFullscreen}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 border border-white/10
                  hover:bg-white/10 text-white/60 hover:text-white transition-all duration-150"
                title={isNativeFullscreen ? 'Keluar Fullscreen (F)' : 'Fullscreen Penuh (F)'}
              >
                {isNativeFullscreen ? <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>

              {/* Reset file button */}
              {slides.length > 0 && (
                <button
                  onClick={resetPresentation}
                  className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 border border-white/10
                    hover:bg-white/10 text-[#7EA0C5] hover:text-white transition-all duration-150"
                  title="Ganti File Baru"
                >
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              )}

              {/* Close */}
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 border border-white/10
                  hover:bg-red-500/20 hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all duration-150"
                title="Tutup (Esc)"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          {/* MAIN STAGE */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 xl:p-8 overflow-hidden relative">
            
            {/* 1. UPLOAD STAGE */}
            {slides.length === 0 && (
              <div className="w-full max-w-2xl text-center space-y-6 z-10">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-3 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer
                    transition-all duration-300 backdrop-blur-md relative overflow-hidden group
                    ${dragging 
                      ? 'border-[#1E90FF] bg-[#1E90FF]/10 shadow-[0_0_50px_rgba(84,130,180,0.2)] scale-[1.01]' 
                      : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8 hover:shadow-[0_4px_30px_rgba(255,255,255,0.02)]'
                    }`}
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {loading ? (
                      <Loader2 className="w-10 h-10 animate-spin text-[#1E90FF]" />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-[#1E90FF] group-hover:text-white transition-colors" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight">
                      {loading ? 'Sedang Membaca & Memproses File...' : 'Seret File Anda di Sini'}
                    </h3>
                    <p className="text-white/50 text-sm">
                      {loading ? 'Memparsing slide client-side secara aman' : 'Atau klik untuk menelusuri file dari komputer Anda'}
                    </p>
                  </div>

                  {/* Badges of supported formats */}
                  <div className="flex flex-wrap gap-2.5 justify-center mt-3">
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold rounded-lg">
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold rounded-lg">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel / CSV
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold rounded-lg">
                      <FileText className="w-3.5 h-3.5" /> Teks / Markdown
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls,.csv,.txt,.md"
                    className="hidden"
                  />
                </div>

                {/* Important Help Tip banner */}
                <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 text-left backdrop-blur-md">
                  <AlertCircle className="w-5 h-5 text-[#1E90FF] flex-shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white tracking-wider uppercase">
                      💡 TIPS UTK DOKUMEN PRESENTASI (PPTX / KEYNOTE)
                    </h4>
                    <p className="text-white/60 text-[11px] leading-relaxed">
                      Untuk mempresentasikan slide PowerPoint (.pptx) atau Keynote, silakan <b>Save As / Export sebagai PDF</b> terlebih dahulu. PDF akan dirender dengan ketajaman visual 100% sempurna di browser tanpa perubahan tata letak font/animasi!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. VIEWER PLAYER STAGE */}
            {slides.length > 0 && (
              <div className="w-full h-full flex flex-col justify-between items-center z-10">
                
                {/* Active Slide Display Area */}
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                  
                  <div key={currentSlide} className="w-full h-full flex items-center justify-center animate-slide-change">
                    {/* PDF PRESENTATION PLAYER */}
                    {fileType === 'pdf' && (
                      <PdfSlideRenderer page={slides[currentSlide]} zoom={zoom} />
                    )}

                    {/* EXCEL TABLE PRESENTATION PLAYER */}
                    {fileType === 'excel' && (
                      <div className="w-full max-w-5xl max-h-[70vh] bg-slate-950/80 border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col gap-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-shrink-0">
                          <span className="text-[#1E90FF] font-bold text-sm bg-[#1E90FF]/20 border border-[#1E90FF]/30 px-3 py-1 rounded-lg">
                            📊 Sheet: {slides[currentSlide].sheetName}
                          </span>
                          <span className="text-white/40 text-xs font-mono">
                            {slides[currentSlide].data.length} baris terdeteksi
                          </span>
                        </div>
                        
                        {/* Interactive Sheet Table */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b border-white/15 sticky top-0 bg-slate-900 z-10">
                                {slides[currentSlide].data[0]?.map((cell: any, idx: number) => (
                                  <th key={idx} className="px-4 py-3 text-xs font-black text-[#7EA0C5] uppercase tracking-wider">
                                    {cell !== null && cell !== undefined ? String(cell) : ''}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {slides[currentSlide].data.slice(1).map((row: any[], rowIdx: number) => (
                                <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  {row.map((cell: any, cellIdx: number) => (
                                    <td key={cellIdx} className="px-4 py-3.5 text-xs text-white/80 font-medium">
                                      {cell !== null && cell !== undefined ? String(cell) : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TEXT/MARKDOWN PRESENTATION PLAYER */}
                    {fileType === 'text' && (
                      <div className="w-full max-w-4xl min-h-[50vh] flex flex-col justify-center items-center text-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#1E90FF]/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="space-y-8 max-w-2xl">
                          <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                            {slides[currentSlide].title}
                          </h2>
                          
                          {slides[currentSlide].content.length > 0 && (
                            <div className="flex flex-col items-center justify-center gap-3.5 mt-6">
                              {slides[currentSlide].content.map((bullet: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-lg text-white/80 font-semibold text-left w-full max-w-lg leading-relaxed">
                                  <div className="w-2 h-2 rounded-full bg-[#1E90FF] flex-shrink-0 shadow-[0_0_10px_rgba(84,130,180,0.8)]" />
                                  <span>{bullet}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* SLIDE NAVIGATION CONTROLS */}
                <div className="flex items-center justify-between w-full max-w-xl flex-shrink-0 py-3 mt-4 z-20">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white transition-all"
                    title="Slide Sebelumnya (Arrow Left)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-white font-black text-base font-mono">
                      {currentSlide + 1} / {slides.length}
                    </span>
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                      Sesi Slide
                    </span>
                  </div>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === slides.length - 1}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white transition-all"
                    title="Slide Selanjutnya (Arrow Right / Space)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* FOOTER BAR */}
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-8 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-white/10 flex-shrink-0 z-20">
            <div className="text-white/40 text-xs font-semibold">
              Format: <span className="text-[#7EA0C5] font-black uppercase">{fileType || '-'}</span>
              {fileSize && <span className="text-white/20 mx-2">·</span>}
              {fileSize && <span>Ukuran: <span className="text-[#7EA0C5] font-black">{fileSize}</span></span>}
            </div>

            <div className="text-white/30 text-[11px] font-medium hidden sm:block">
              {slides.length > 0 ? (
                <>
                  Gunakan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">→</kbd> navigasi · 
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">F</kbd> fullscreen · 
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono">Esc</kbd> keluar
                </>
              ) : (
                'File diproses 100% lokal oleh browser Anda'
              )}
            </div>

            <div className="text-white/40 text-xs">
              Presenter: <span className="text-white/60 font-semibold">{user.nama}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
