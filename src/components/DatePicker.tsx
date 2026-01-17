'use client'

import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  required?: boolean
  id?: string
  className?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, min, required, id, className, placeholder }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Set current month to selected date or today
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setCurrentMonth(date)
      }
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(newValue)) {
      const date = new Date(newValue)
      if (!isNaN(date.getTime())) {
        onChange(newValue)
        setCurrentMonth(date)
      }
    } else if (newValue === '') {
      onChange('')
    }
  }

  const handleInputBlur = () => {
    // Validate on blur - if invalid, revert to last valid value
    if (inputValue && !/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      setInputValue(value)
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    onChange(dateStr)
    setInputValue(dateStr)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputClick = () => {
    setIsOpen(true)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    if (!min || today >= new Date(min)) {
      handleDateClick(today)
    }
  }

  // Get calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Monday
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const minDate = min ? new Date(min) : null
  const selectedDate = value ? new Date(value) : null

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    return false
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          placeholder={placeholder || 'YYYY-MM-DD'}
          required={required}
          className={className}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen)
            inputRef.current?.focus()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-4 w-[320px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="text-lg font-bold text-slate-900">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-xs font-semibold text-slate-500 text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const isDisabled = isDateDisabled(day)

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isDisabled && handleDateClick(day)}
                  disabled={isDisabled}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                    ${!isCurrentMonth ? 'text-slate-300' : ''}
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'}
                    ${isSelected ? 'bg-indigo-600 text-white font-semibold hover:bg-indigo-700' : ''}
                    ${isToday && !isSelected ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}
                    ${!isSelected && !isToday && isCurrentMonth && !isDisabled ? 'text-slate-900' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={goToToday}
              disabled={minDate ? new Date() < minDate : false}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
