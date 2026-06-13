'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  Link2,
  Download,
  Check,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

interface ShareSheetProps {
  type: 'review' | 'annotation'
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ShareSheet({
  type,
  id,
  open,
  onOpenChange,
}: ShareSheetProps) {
  const [view, setView] = useState<'options' | 'story'>('options')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (!open) {
      setView('options')
      setPreviewUrl(null)
      setLoading(false)
      setFetchError(null)
      setCopied(false)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  if (!open) return null

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${type === 'review' ? 'reviews' : 'annotations'}/${id}`
      : ''

  async function handleStoryClick() {
    setView('story')
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/share/story?type=${type}&id=${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      setPreviewUrl(url)
    } catch {
      setFetchError('Could not generate the story card. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!previewUrl) return
    if (isIOS) {
      window.open(previewUrl, '_blank')
    } else {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = `trackboxd-${type}-${id.slice(0, 8)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  function handleShareOnX() {
    window.open(
      `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />

      {/* Sheet */}
      <div className="relative bg-[#FFFBEb] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 z-50 border border-[#5C5537]/15 shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#5C5537]/10 flex-shrink-0">
          {view === 'story' ? (
            <button
              onClick={() => { setView('options'); setFetchError(null) }}
              className="flex items-center gap-1.5 text-sm text-[#5C5537]/60 hover:text-[#5C5537] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <span className="text-sm font-semibold text-[#5C5537]">Share</span>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="text-[#5C5537]/50 hover:text-[#5C5537] hover:bg-[#5C5537]/8 p-1.5 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3">

          {/* ── Options ── */}
          {view === 'options' && (
            <>
              {/* Instagram Story */}
              <button
                onClick={handleStoryClick}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-[#5C5537]/15 hover:border-[#5C5537]/30 hover:bg-[#5C5537]/5 transition-all text-left"
              >
                <Camera className="w-5 h-5 text-[#5C5537]/55 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#5C5537]">Instagram Story</p>
                  <p className="text-xs text-[#5C5537]/50 mt-0.5">Download a 9:16 card to share</p>
                </div>
              </button>

              {/* X */}
              <button
                onClick={handleShareOnX}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-[#5C5537]/15 hover:border-[#5C5537]/30 hover:bg-[#5C5537]/5 transition-all text-left"
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#5C5537]/55 flex-shrink-0 text-sm font-bold leading-none">
                  𝕏
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#5C5537]">X</p>
                  <p className="text-xs text-[#5C5537]/50 mt-0.5">
                    Post this {type === 'review' ? 'review' : 'annotation'} with a link preview
                  </p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-[#5C5537]/15 hover:border-[#5C5537]/30 hover:bg-[#5C5537]/5 transition-all text-left"
              >
                {copied
                  ? <Check className="w-5 h-5 text-[#5C5537]/55 flex-shrink-0" />
                  : <Link2 className="w-5 h-5 text-[#5C5537]/55 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#5C5537]">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </p>
                  <p className="text-xs text-[#5C5537]/50 mt-0.5">
                    {copied ? 'Link copied to clipboard' : 'Share a link to this page'}
                  </p>
                </div>
              </button>

              {/* Trackboxd branding */}
              <div className="pt-1 text-center">
                <span className="text-xs text-[#5C5537]/30 tracking-wide">trackboxd.com</span>
              </div>
            </>
          )}

          {/* ── Story preview ── */}
          {view === 'story' && (
            <div className="flex flex-col items-center gap-4">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="w-6 h-6 text-[#5C5537]/60 animate-spin" />
                  <span className="text-sm text-[#5C5537]/50">Generating story card…</span>
                </div>
              )}

              {fetchError && !loading && (
                <div className="w-full text-center py-8">
                  <p className="text-sm text-red-500 mb-3">{fetchError}</p>
                  <button
                    onClick={handleStoryClick}
                    className="text-sm text-[#5C5537]/60 hover:text-[#5C5537] underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              )}

              {previewUrl && !loading && (
                <>
                  <img
                    src={previewUrl}
                    alt="Story card preview"
                    className="max-h-96 w-auto rounded-xl border border-[#5C5537]/15 shadow-sm"
                  />

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#1F2C24] text-[#FFFBeb] text-sm font-semibold rounded-xl hover:bg-[#2a3b30] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {isIOS ? 'Open & Save' : 'Save Image'}
                  </button>

                  <p className="text-xs text-[#5C5537]/40 text-center leading-relaxed">
                    {isIOS
                      ? 'Opens in a new tab — long press to save, then share on Instagram.'
                      : 'Saved to your downloads — open Instagram and add to your Story.'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile safe-area bottom padding */}
        <div className="pb-4 sm:pb-0 flex-shrink-0" />
      </div>
    </div>
  )
}
