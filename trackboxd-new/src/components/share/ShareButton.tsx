'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import ShareSheet from './ShareSheet'

interface ShareButtonProps {
  type: 'review' | 'annotation'
  id: string
  variant?: 'dark' | 'light'
}

export default function ShareButton({ type, id, variant = 'dark' }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const dark = variant === 'dark'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          dark
            ? 'text-[#FFFBeb]/55 hover:text-[#FFFBeb] hover:bg-[#FFFBeb]/10'
            : 'text-[#5C5537]/50 hover:text-[#5C5537]'
        }`}
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
      <ShareSheet type={type} id={id} open={open} onOpenChange={setOpen} />
    </>
  )
}
