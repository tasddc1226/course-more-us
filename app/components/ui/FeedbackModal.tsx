import { useState, useRef, useEffect } from 'react'
import Textarea from './Textarea'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: string) => void
  isSubmitting?: boolean
}

export function FeedbackModal({ isOpen, onClose, onSubmit, isSubmitting = false }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setFeedback('')
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback.trim())
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    // 스페이스바, 엔터키로 모달이 닫히는 것을 방지
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
    }
  }

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <button 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm border-0 p-0"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      aria-label="모달 닫기"
    >
      <div className="w-full max-w-sm mx-4 mb-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            피드백
          </h3>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            피드백이나 제안사항을 입력해주세요
          </p>
          
          <Textarea
            ref={textareaRef}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="개선사항이나 버그 신고, 새로운 기능 제안 등을 자유롭게 작성해주세요."
            className="h-32 resize-none text-sm"
            disabled={isSubmitting}
            maxLength={1000}
            resize="none"
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {feedback.length}/1000
            </span>
          </div>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <div className="w-px bg-gray-100" />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !feedback.trim()}
            className="flex-1 py-4 text-purple-600 font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:text-gray-400"
          >
            {isSubmitting ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>
    </button>
  )
}