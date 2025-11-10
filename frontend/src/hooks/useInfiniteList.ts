import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseInfiniteListOptions {
  pageSize?: number
  disabled?: boolean
}

export function useInfiniteList<T>(items: T[], options: UseInfiniteListOptions = {}) {
  const { pageSize = 10, disabled = false } = options
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const clampedItems = useMemo(() => items ?? [], [items])

  useEffect(() => {
    if (disabled) {
      return
    }
    setVisibleCount(pageSize)
  }, [clampedItems, pageSize, disabled])

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const hasMore = !disabled && visibleCount < clampedItems.length

  const loadMore = useCallback(() => {
    if (disabled) {
      return
    }
    setVisibleCount((prev) => {
      if (prev >= clampedItems.length) {
        return prev
      }
      return Math.min(prev + pageSize, clampedItems.length)
    })
  }, [clampedItems.length, disabled, pageSize])

  const sentinelRef = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      if (!node || disabled) {
        return
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          loadMore()
        }
      })

      observerRef.current.observe(node)
    },
    [disabled, hasMore, loadMore]
  )

  const visibleItems = useMemo(() => clampedItems.slice(0, visibleCount), [clampedItems, visibleCount])

  return {
    visibleItems,
    sentinelRef,
    hasMore,
    total: clampedItems.length,
  }
}
