import confetti from 'canvas-confetti'

// 폭죽 효과 타입 정의
export type CelebrationTypes = 
  | 'feedback'    // 피드백 완료 (절제된 축하)
  | 'success'     // 일반적인 성공 (중간 정도)
  | 'achievement' // 큰 성취 (화려한 축하)
  | 'like'        // 좋아요/추천 (작고 귀여운 효과)

// 기본 색상 팔레트
const DEFAULT_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7']
const LOVE_COLORS = ['#ff6b9d', '#c44569', '#f8b500', '#ff3838', '#ff9ff3']
const SUCCESS_COLORS = ['#55a3ff', '#1dd1a1', '#feca57', '#48dbfb', '#ff9ff3']

// 폭죽 효과 함수들
export const triggerFeedbackCelebration = () => {
  // 절제된 피드백 완료 축하
  confetti({
    particleCount: 50,
    angle: 90,
    spread: 45,
    origin: { x: 0.5, y: 0.7 },
    colors: DEFAULT_COLORS,
    gravity: 0.8,
    scalar: 0.8
  })

  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 75,
      spread: 35,
      origin: { x: 0.3, y: 0.8 },
      colors: DEFAULT_COLORS,
      gravity: 0.9,
      scalar: 0.7
    })
    confetti({
      particleCount: 30,
      angle: 105,
      spread: 35,
      origin: { x: 0.7, y: 0.8 },
      colors: DEFAULT_COLORS,
      gravity: 0.9,
      scalar: 0.7
    })
  }, 200)
}

export const triggerSuccessCelebration = () => {
  // 중간 정도의 성공 축하
  confetti({
    particleCount: 100,
    angle: 90,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: SUCCESS_COLORS,
    gravity: 0.7,
    scalar: 1
  })

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 50,
      origin: { x: 0.25, y: 0.7 },
      colors: SUCCESS_COLORS,
      gravity: 0.8
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 50,
      origin: { x: 0.75, y: 0.7 },
      colors: SUCCESS_COLORS,
      gravity: 0.8
    })
  }, 300)
}

export const triggerAchievementCelebration = () => {
  // 큰 성취를 위한 화려한 축하
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: SUCCESS_COLORS
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: LOVE_COLORS
    })
  }, 250)
}

export const triggerLikeCelebration = (origin: { x: number; y: number } = { x: 0.5, y: 0.8 }) => {
  // 작고 귀여운 좋아요 효과
  confetti({
    particleCount: 20,
    angle: 90,
    spread: 30,
    origin,
    colors: LOVE_COLORS,
    gravity: 1,
    scalar: 0.6,
    drift: 0,
    ticks: 50
  })
}

// 통합 트리거 함수
export const triggerCelebration = (
  type: CelebrationTypes,
  options?: {
    origin?: { x: number; y: number }
    colors?: string[]
    delay?: number
  }
) => {
  const { delay = 0 } = options || {}

  const execute = () => {
    switch (type) {
      case 'feedback':
        triggerFeedbackCelebration()
        break
      case 'success':
        triggerSuccessCelebration()
        break
      case 'achievement':
        triggerAchievementCelebration()
        break
      case 'like':
        triggerLikeCelebration(options?.origin)
        break
      default:
        triggerSuccessCelebration()
    }
  }

  if (delay > 0) {
    setTimeout(execute, delay)
  } else {
    execute()
  }
}

// React 컴포넌트 (필요한 경우 사용)
interface ConfettiCelebrationProps {
  trigger: boolean
  type?: CelebrationTypes
  onComplete?: () => void
  delay?: number
  origin?: { x: number; y: number }
}

export function ConfettiCelebration({
  trigger,
  type = 'success',
  onComplete,
  delay = 0,
  origin
}: ConfettiCelebrationProps) {
  if (trigger) {
    triggerCelebration(type, { origin, delay })
    onComplete?.()
  }

  return null // 시각적 컴포넌트가 아님
} 