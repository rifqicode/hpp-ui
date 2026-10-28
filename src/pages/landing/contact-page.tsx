import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/utils"
import { PublicFooter, PublicHeader } from "./components/public-navigation"
import { useLandingContact } from "./hooks/use-landing-contact"

const TOPICS = ["Fitur dan cara penggunaan", "Pilihan paket", "Bantuan akun", "Pertanyaan lainnya"]
const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 sm:text-sm scroll-mt-32 placeholder:text-slate-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:bg-slate-50"

export default function ContactPage() {
  const { whatsapp, status, retry } = useLandingContact()
  const [name, setName] = useState("")
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState("")
  const available = status === "ready" && Boolean(whatsapp)

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Hubungi Kami | ${APP_NAME}`
    window.scrollTo({ top: 0, behavior: "instant" })
    return () => { document.title = previousTitle }
  }, [])

  function openWhatsApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!whatsapp || !message.trim()) return
    const url = new URL(whatsapp.url)
    url.searchParams.set("text", `Halo tim ${APP_NAME},${name.trim() ? ` saya ${name.trim()}.` : ""}\n\nTopik: ${topic}\n${message.trim()}`)
    window.open(url.toString(), "_blank", "noopener,noreferrer")
  }

  return (
    <div className="brand-light-surface flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased selection:bg-primary selection:text-white">
      <a href="#konten-utama" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-primary focus:shadow-lg">Lewati navigasi</a>
      <PublicHeader />
      <main id="konten-utama" tabIndex={-1} className="flex-1 scroll-mt-32 lg:scroll-mt-20">
        <section aria-labelledby="contact-heading" className="border-b border-slate-200 py-5 sm:py-10 lg:py-6" style={{ background: "radial-gradient(ellipse 40% 50% at 90% 20%, rgba(96,165,250,.14), transparent 100%), radial-gradient(ellipse 40% 45% at 60% 65%, rgba(var(--brand-indigo-rgb),.1), transparent 100%), #FFFFFF" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="grid items-center gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <Link to="/" className="mb-2 inline-flex sm:mb-4 min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft aria-hidden="true" className="size-4" />Homepage</Link>
                <p className="mb-3 text-sm font-semibold sm:mb-4 text-primary">Hubungi kami</p>
                <h1 id="contact-heading" className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">Bicarakan kebutuhan usaha Anda.</h1>
                <p className="mt-3 max-w-lg text-sm sm:mt-5 sm:text-base leading-relaxed text-slate-600">Ingin tahu apakah Ekatra cocok untuk usaha Anda, memilih paket, atau butuh bantuan penggunaan? Ceritakan kepada kami.</p>

                <div className="mt-4 flex items-start gap-3 text-sm sm:mt-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-primary"><MessageCircle aria-hidden="true" className="size-5" /></span>
                  <div>
                    <p className="font-semibold text-slate-900">Percakapan lewat WhatsApp</p>
                    <p className="mt-1 leading-relaxed text-slate-600">Tulis pertanyaan di sini, lalu lanjutkan percakapan dengan tim Ekatra.</p>
                  </div>
                </div>
              </div>

              <div className="relative isolate lg:col-span-7">
                <img
                  src="/images/ekatra-contact-host.webp"
                  srcSet="/images/ekatra-contact-host-mobile.webp 640w, /images/ekatra-contact-host.webp 1200w"
                  sizes="(min-width: 640px) 320px, 240px"
                  width={1200}
                  height={800}
                  decoding="async"
                  alt="Karakter Ekatra tersenyum menyambut Anda dengan kedua tangan merangkul bagian atas formulir"
                  className="pointer-events-none relative z-20 mx-auto -mb-12 block h-auto w-full max-w-60 select-none sm:max-w-80 lg:w-[clamp(220px,34svh,320px)]"
                />
                <div className="relative z-10 rounded-2xl border border-slate-200 bg-white px-5 pb-5 pt-14 shadow-sm sm:px-6 sm:pb-6">
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Apa yang ingin Anda tanyakan?</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Pilih topik dan tuliskan pertanyaan Anda.</p>
                <form onSubmit={openWhatsApp} className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-3">
                  <div>
                    <label htmlFor="contact-name" className="text-sm font-semibold">Nama <span className="font-normal text-slate-500">(opsional)</span></label>
                    <input id="contact-name" autoComplete="name" maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Nama Anda" className={fieldClass} />
                  </div>
                  <div>
                    <label htmlFor="contact-topic" className="text-sm font-semibold">Topik pertanyaan</label>
                    <select id="contact-topic" value={topic} onChange={event => setTopic(event.target.value)} className={fieldClass}>{TOPICS.map(item => <option key={item}>{item}</option>)}</select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="contact-message" className="text-sm font-semibold">Pertanyaan Anda</label>
                    <textarea id="contact-message" required maxLength={2000} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="Contoh: Saya punya usaha katering. Apakah bisa mencatat produksi untuk pesanan harian?" className={`${fieldClass} min-h-28 resize-y sm:min-h-0`} />
                  </div>
                  <div aria-live="polite" className="empty:hidden sm:col-span-2">
                    {status === "loading" && <p className="text-sm text-slate-600">Memuat kontak WhatsApp…</p>}
                    {status === "error" && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p>Kontak belum berhasil dimuat. Silakan coba lagi.</p><button type="button" onClick={retry} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Muat ulang kontak</button></div>}
                    {status === "ready" && !whatsapp && <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">Kontak WhatsApp sedang tidak tersedia. Silakan kembali lagi nanti atau lihat pertanyaan umum di beranda.</p>}
                  </div>
                  <Button type="submit" disabled={!available || !message.trim()} className="public-mobile-button h-11 w-full bg-primary px-5 font-semibold sm:col-span-2 text-white hover:bg-primary/90">Lanjut ke WhatsApp <ArrowRight aria-hidden="true" className="ml-2 size-4" /></Button>
                  <p className="text-xs leading-relaxed text-slate-500 sm:col-span-2">Pesan akan dibuka di WhatsApp. Anda bisa memeriksa dan mengirimkannya dari sana.</p>
                </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="contact-faq-heading" className="bg-slate-50/60 py-10 sm:py-14">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div><h2 id="contact-faq-heading" className="text-xl font-bold tracking-tight">Mungkin jawabannya sudah ada di sini.</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Baca pertanyaan umum tentang memulai, alur produksi, dan pilihan paket.</p></div>
            <Button variant="outline" asChild className="public-mobile-button h-12 shrink-0 border-slate-300 bg-white px-5 text-slate-700 hover:bg-slate-100"><a href="/#faq">Lihat pertanyaan umum <ArrowRight aria-hidden="true" className="ml-2 size-4" /></a></Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
