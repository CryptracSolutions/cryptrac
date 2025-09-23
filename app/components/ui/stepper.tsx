"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepperProps {
  steps: {
    id: number
    title: string
    description?: string
  }[]
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  className
}: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {orientation === 'horizontal' ? (
        <div className="flex items-start justify-between relative max-md:overflow-x-auto max-md:px-2 max-md:pb-2">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep
            const isUpcoming = step.id > currentStep
            const isNotLast = index < steps.length - 1

            return (
              <div key={step.id} className="flex flex-col items-center relative flex-1">
                {/* Step Circle */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-sm relative z-10 max-md:w-10 max-md:h-10",
                  isCompleted && "bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] border-[#7f5efd] text-white shadow-lg scale-105",
                  isCurrent && "border-[#7f5efd] text-[#7f5efd] bg-gradient-to-br from-[#7f5efd]/10 to-[#9f7aea]/10 shadow-md",
                  isUpcoming && "border-gray-300 text-gray-400 bg-white"
                )}>
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>

                {/* Connector Line */}
                {index > 0 && (
                  <div className="absolute top-6 left-0 right-1/2 h-0.5 -translate-y-1/2 z-0">
                    <div className={cn(
                      "h-full transition-all duration-500 mr-6",
                      steps[index - 1].id < currentStep ? "bg-gradient-to-r from-[#7f5efd] to-[#9f7aea]" : "bg-gray-300"
                    )} />
                  </div>
                )}
                {isNotLast && (
                  <div className="absolute top-6 left-1/2 right-0 h-0.5 -translate-y-1/2 z-0">
                    <div className={cn(
                      "h-full transition-all duration-500 ml-6",
                      isCompleted ? "bg-gradient-to-r from-[#7f5efd] to-[#9f7aea]" : "bg-gray-300"
                    )} />
                  </div>
                )}

                {/* Step Content */}
                <div className="flex flex-col items-center mt-3 px-2">
                  <h3 className={cn(
                    "text-sm font-semibold leading-snug text-center max-md:text-xs",
                    isCurrent && "text-[#7f5efd]",
                    isCompleted && "text-gray-900",
                    isUpcoming && "text-gray-400"
                  )}>
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className={cn(
                      "text-xs mt-1 leading-relaxed text-center max-w-[140px] max-md:text-[11px]",
                      isCurrent && "text-gray-600",
                      isCompleted && "text-gray-500",
                      isUpcoming && "text-gray-400"
                    )}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Vertical orientation - keep existing logic */
        <div className="flex flex-col space-y-4 max-md:space-y-3">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep
            const isUpcoming = step.id > currentStep

            return (
              <div key={step.id} className="flex flex-row items-center space-x-3 max-md:items-start">
                {/* Step Circle */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-sm max-md:w-10 max-md:h-10",
                  isCompleted && "bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] border-[#7f5efd] text-white shadow-lg scale-105",
                  isCurrent && "border-[#7f5efd] text-[#7f5efd] bg-gradient-to-br from-[#7f5efd]/10 to-[#9f7aea]/10 shadow-md",
                  isUpcoming && "border-gray-300 text-gray-400 bg-white"
                )}>
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex flex-col">
                  <h3 className={cn(
                    "text-sm font-semibold leading-snug max-md:text-xs",
                    isCurrent && "text-[#7f5efd]",
                    isCompleted && "text-gray-900",
                    isUpcoming && "text-gray-400"
                  )}>
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className={cn(
                      "text-xs mt-1 leading-relaxed max-md:text-[11px]",
                      isCurrent && "text-gray-600",
                      isCompleted && "text-gray-500",
                      isUpcoming && "text-gray-400"
                    )}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Stepper
