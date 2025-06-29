import { useState, useEffect } from 'react'
import { cn } from '~/utils/cn'

interface CalendarProps {
  name: string
  label?: string
  value?: string
  onChange?: (date: string) => void
  minDate?: Date
  required?: boolean
  helperText?: string
  className?: string
}

function Calendar({
  name,
  label,
  value,
  onChange,
  minDate = new Date(),
  required = false,
  helperText,
  className
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(value || '')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (value) {
      setSelectedDate(value)
    }
  }, [value])

  const today = new Date()
  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()

  // 월의 첫째 날
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1)
  
  // 달력 그리드를 위한 시작일 (이전 월의 마지막 주 포함)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  // 6주 * 7일 = 42일의 날짜 배열 생성
  const calendarDays = []
  const currentDate = new Date(startDate)
  
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const formatDateString = (date: Date) => {
    // 로컬 시간대를 유지하면서 YYYY-MM-DD 형식으로 변환
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return ''
    // 로컬 시간대를 유지하면서 Date 객체 생성
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const handleDateClick = (date: Date) => {
    const dateString = formatDateString(date)
    setSelectedDate(dateString)
    onChange?.(dateString)
    setIsOpen(false)
  }

  const isDateDisabled = (date: Date) => {
    return date < minDate
  }

  const isDateSelected = (date: Date) => {
    return selectedDate === formatDateString(date)
  }

  const isToday = (date: Date) => {
    return formatDateString(date) === formatDateString(today)
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonthIndex
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedDate}
        required={required}
      />

      {/* Date display button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-3 text-left border border-gray-300 rounded-xl shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
          'bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200',
          selectedDate ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        {selectedDate ? formatDisplayDate(selectedDate) : '날짜를 선택해주세요'}
        <span className="float-right text-gray-400">📅</span>
      </button>

      {helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {/* Month navigation */}
          <div className="flex items-center justify-between p-4 border-b">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h3 className="font-semibold text-gray-900">
              {currentYear}년 {monthNames[currentMonthIndex]}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>

          {/* Calendar grid */}
          <div className="p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar dates */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const disabled = isDateDisabled(date)
                const selected = isDateSelected(date)
                const todayDate = isToday(date)
                const currentMonthDate = isCurrentMonth(date)

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !disabled && handleDateClick(date)}
                    disabled={disabled}
                    className={cn(
                      'p-2 text-sm rounded-md transition-colors',
                      'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500',
                      {
                        // 기본 스타일
                        'text-gray-900': currentMonthDate && !disabled,
                        'text-gray-400': !currentMonthDate,
                        'text-gray-300 cursor-not-allowed': disabled,
                        
                        // 선택된 날짜
                        'bg-purple-600 text-white hover:bg-purple-700': selected,
                        
                        // 오늘 날짜
                        'bg-purple-100 text-purple-800 font-semibold': todayDate && !selected,
                        
                        // 비활성화된 날짜
                        'opacity-50': disabled
                      }
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Close button */}
          <div className="p-4 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar 