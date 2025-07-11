import { useState } from 'react';
import type { Tables } from '~/types/database.types';

type TimeSlot = Tables<'time_slots'>;

interface TimeSlotSelectorProps {
  timeSlots: TimeSlot[];
  selectedTimeSlots: number[];
  onChange: (selectedIds: number[]) => void;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  helperText?: string;
}

export function TimeSlotSelector({
  timeSlots,
  selectedTimeSlots,
  onChange,
  label = "시간대 선택",
  required = false,
  multiple = true,
  helperText
}: TimeSlotSelectorProps) {
  const handleTimeSlotToggle = (timeSlotId: number) => {
    if (multiple) {
      const newSelection = selectedTimeSlots.includes(timeSlotId)
        ? selectedTimeSlots.filter(id => id !== timeSlotId)
        : [...selectedTimeSlots, timeSlotId];
      onChange(newSelection);
    } else {
      onChange([timeSlotId]);
    }
  };

  const getTimeSlotIcon = (timeSlotName: string) => {
    if (timeSlotName.includes('점심')) return '🍽️';
    if (timeSlotName.includes('오후')) return '☕';
    if (timeSlotName.includes('저녁')) return '🌆';
    if (timeSlotName.includes('밤')) return '🌙';
    return '⏰';
  };

  return (
    <div>
      <div className="block text-sm font-medium text-gray-700 mb-3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {multiple && (
          <span className="text-sm text-gray-500 ml-2">(복수 선택 가능)</span>
        )}
      </div>
      
      {helperText && (
        <p className="text-sm text-gray-600 mb-3">{helperText}</p>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {timeSlots.map((timeSlot) => {
          const isSelected = selectedTimeSlots.includes(timeSlot.id);
          
          return (
            <button
              key={timeSlot.id}
              type="button"
              onClick={() => handleTimeSlotToggle(timeSlot.id)}
              className={`
                relative p-4 border-2 rounded-xl transition-all duration-200
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${timeSlot.name} 시간대 ${isSelected ? '선택됨' : '선택'}`}
            >
              {/* 선택 상태 표시 */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{getTimeSlotIcon(timeSlot.name)}</span>
                <div className={`text-sm font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                  {timeSlot.name}
                </div>
              </div>
              
              <div className={`text-xs ${isSelected ? 'text-purple-600' : 'text-gray-500'}`}>
                {timeSlot.start_time} - {timeSlot.end_time}
              </div>
              
              {timeSlot.description && (
                <div className={`text-xs mt-1 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}>
                  {timeSlot.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedTimeSlots.length > 0 && (
        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
          <div className="text-sm text-purple-700 font-medium">
            선택된 시간대 ({selectedTimeSlots.length}개)
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {timeSlots
              .filter(ts => selectedTimeSlots.includes(ts.id))
              .map(ts => ts.name)
              .join(', ')
            }
          </div>
        </div>
      )}
    </div>
  );
}