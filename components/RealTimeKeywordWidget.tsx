"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, ArrowDown, Minus, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const seed = ["총선", "가상화폐", "카카오", "환경 보호", "주식 시장", "삼성", "인공지능"]

export default function RealTimeKeywordWidget({
  intervalMs = 2500,
  width = 270,
}: {
  intervalMs?: number
  width?: number | string
}) {
  // 초기 데이터 (실서비스에선 서버/소켓 데이터로 교체)
  const [items, setItems] = useState(
    seed.map((kw, i) => ({ keyword: kw, rank: i + 1, diff: 0 }))
  )
  const [isLoading, setIsLoading] = useState(false)
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showFullList, setShowFullList] = useState(false)
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 })
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  const timerRef = useRef<number | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // 트렌딩 키워드 가져오기
  const fetchTrendingKeywords = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/news/trending-keywords?limit=10&period=24h')
      if (response.ok) {
        const data = await response.json()
        if (data.keywords && data.keywords.length > 0) {
          setItems(data.keywords.map((kw: any, i: number) => ({
            keyword: kw.keyword,
            rank: kw.rank || i + 1,
            diff: kw.diff || 0
          })))
        }
      }
    } catch (error) {
      console.error('트렌딩 키워드 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    fetchTrendingKeywords()
  }, [])

  // 주기적 순환 및 데이터 업데이트
  useEffect(() => {
    if (paused) return
    timerRef.current = window.setInterval(() => {
      // 다음 인덱스
      setIdx((p) => (p + 1) % items.length)

      // 30초마다 트렌딩 키워드 새로고침
      if (Math.random() < 0.1) { // 10% 확률로 새로고침
        fetchTrendingKeywords()
      }
    }, intervalMs)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [intervalMs, paused, items.length])

  const cur = items[idx]

  const DiffIcon = ({ diff }: { diff: number }) =>
    diff < 0 ? (
      <ArrowUp className="w-3 h-3 text-red-500 animate-bounce" />
    ) : diff > 0 ? (
      <ArrowDown className="w-3 h-3 text-blue-500 animate-bounce" />
    ) : (
      <Minus className="w-3 h-3 text-gray-400" />
    )

  const handleCardClick = () => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect()
      setCardPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      })
    }
    setShowFullList(true)
    setPaused(true)
  }

  const handleKeywordClick = (keyword: string) => {
    // 검색 페이지로 이동
    window.location.href = `/search?q=${encodeURIComponent(keyword)}`
  }

  const handleWidgetMouseEnter = () => {
    setPaused(true)
  }

  const handleWidgetMouseLeave = () => {
    // 호버링 카드에 마우스가 있으면 카드를 유지
    if (!isHoveringCard) {
      setTimeout(() => {
        if (!isHoveringCard) {
          setShowFullList(false)
          setPaused(false)
        }
      }, 100)
    }
  }

  const handleCardMouseEnter = () => {
    setIsHoveringCard(true)
    setPaused(true)
    setShowFullList(true)
  }

  const handleCardMouseLeave = () => {
    setIsHoveringCard(false)
    setShowFullList(false)
    setPaused(false)
  }

  return (
    <>
      <div
        ref={widgetRef}
        className="glass-enhanced hover-lift animate-slide-in rounded-xl shadow-md px-4 py-3 shimmer-effect relative"
        style={{ width, "--delay": "0.2s" } as React.CSSProperties}
        onMouseEnter={handleWidgetMouseEnter}
        onMouseLeave={handleWidgetMouseLeave}
      >
        <div className="glass-content">
          {/* 헤더 */}
          <div className="flex items-center mb-3">
            <div className="flex items-center text-sm font-semibold">
              <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
              실시간 인기 키워드
            </div>
          </div>

          {/* 한 줄 티커 영역 */}
          <div className="h-9 overflow-hidden">
            {/* 키 바뀔 때마다 자연스러운 페이드/슬라이드 */}
            <div
              key={`${cur.keyword}-${cur.rank}`}
              className="keyword-item-glass flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-500 group cursor-pointer hover:bg-blue-50 hover:border-2 hover:border-blue-200 hover:shadow-lg hover:scale-105"
              style={{ "--delay": "0.3s" } as React.CSSProperties}
              onClick={() => handleKeywordClick(cur.keyword)}
            >
              <span className="flex items-center gap-2">
                <span 
                  className={`font-bold w-5 text-right ${
                    cur.rank === 1
                      ? "text-red-500"
                      : cur.rank === 2
                      ? "text-orange-500"
                      : cur.rank === 3
                      ? "text-yellow-500"
                      : "text-blue-600"
                  }`}
                >
                  {cur.rank}
                </span>
                <span className="text-gray-800 group-hover:text-blue-700 group-hover:underline transition-colors duration-200">
                  {cur.keyword}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <DiffIcon diff={cur.diff} />
                {cur.rank <= 3 && (
                  <Badge 
                    variant="secondary"
                    className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
                  >
                    HOT
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 전체 리스트 호버링 카드 - 컨테이너 밖으로 나오도록 */}
      {showFullList && (
        <div 
          ref={cardRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] max-h-64 overflow-y-auto"
          style={{
            top: `${cardPosition.top}px`,
            left: `${cardPosition.left}px`,
            width: typeof width === 'number' ? `${width}px` : width,
            minWidth: '250px'
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="p-3">
            <div className="text-xs font-semibold text-gray-600 mb-2 px-2">전체 순위</div>
            <div className="space-y-1">
              {items.map((item, index) => (
                <div 
                  key={`${item.keyword}-${item.rank}-${index}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  onClick={() => handleKeywordClick(item.keyword)}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-bold text-sm w-6 text-center ${
                        item.rank === 1
                          ? "text-red-500"
                          : item.rank === 2
                          ? "text-orange-500"
                          : item.rank === 3
                          ? "text-yellow-500"
                          : "text-blue-600"
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-gray-800 text-sm">
                      {item.keyword}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DiffIcon diff={item.diff} />
                    {item.rank <= 3 && (
                      <Badge 
                        variant="secondary"
                        className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full shadow-lg"
                      >
                        HOT
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
