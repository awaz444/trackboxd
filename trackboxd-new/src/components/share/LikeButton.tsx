'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  type: 'review' | 'annotation'
  id: string
  initialLikeCount: number
  userId: string | null
  variant?: 'dark' | 'light'
}

export default function LikeButton({ type, id, initialLikeCount, userId, variant = 'dark' }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    const check = async () => {
      if (!userId) { setInitialLoad(false); return }
      try {
        const endpoint = type === 'review'
          ? `/api/likes/review?userId=${userId}&reviewId=${id}`
          : `/api/likes/annotation?userId=${userId}&annotationId=${id}`
        const res = await fetch(endpoint)
        const data = await res.json()
        setIsLiked(!!data.isLiked)
      } catch {
        // noop
      } finally {
        setInitialLoad(false)
      }
    }
    check()
  }, [userId, id, type])

  const handleToggle = async () => {
    if (!userId || isLoading || initialLoad) return
    setIsLoading(true)
    const next = !isLiked
    setIsLiked(next)
    setLikeCount(next ? likeCount + 1 : Math.max(0, likeCount - 1))
    try {
      const endpoint = type === 'review' ? '/api/likes/review' : '/api/likes/annotation'
      const body = type === 'review'
        ? { userId, reviewId: id }
        : { userId, annotationId: id }
      const res = await fetch(endpoint, {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
    } catch {
      setIsLiked(!next)
      setLikeCount(initialLikeCount)
    } finally {
      setIsLoading(false)
    }
  }

  const dark = variant === 'dark'
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || initialLoad || !userId}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        !userId
          ? dark ? 'text-[#FFFBeb]/30 cursor-not-allowed' : 'text-[#5C5537]/30 cursor-not-allowed'
          : isLiked
          ? dark ? 'bg-[#FFFBeb]/15 text-[#FFFBeb]' : 'text-[#5C5537]'
          : dark ? 'text-[#FFFBeb]/55 hover:text-[#FFFBeb] hover:bg-[#FFFBeb]/10' : 'text-[#5C5537]/50 hover:text-[#5C5537]'
      }`}
    >
      <Heart className={`w-4 h-4 ${isLiked ? (dark ? 'fill-[#FFFBeb]' : 'fill-[#5C5537]') : ''}`} />
      <span>{likeCount}</span>
    </button>
  )
}
