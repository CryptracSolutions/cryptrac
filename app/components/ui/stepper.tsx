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
  const completionPercentage = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className={cn("relative", className)}>
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#7f5efd] to-[#9f7aea] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Stepper */}
      <div className={cn(
        "flex",
        orientation === 'horizontal' ? "flex-row items-center justify-between" : "flex-col space-y-4"
      )}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep

          return (
            <div key={step.id} className={cn(
              "flex items-center transition-all duration-500",
              orientation === 'horizontal' ? "flex-col text-center" : "flex-row space-x-3"
            )}>
              {/* Step Circle */}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-sm",
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
              <div className={cn(
                orientation === 'horizontal' ? "mt-3" : "flex-1"
              )}>
                <h3 className={cn(
                  "text-sm font-semibold leading-snug",
                  isCurrent && "text-[#7f5efd]",
                  isCompleted && "text-gray-900",
                  isUpcoming && "text-gray-400"
                )}>
                  {step.title}
                </h3>
                {step.description && (
                  <p className={cn(
                    "text-xs mt-1 leading-relaxed",
                    isCurrent && "text-gray-600",
                    isCompleted && "text-gray-500",
                    isUpcoming && "text-gray-400"
                  )}>
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector Line (for horizontal layout) */}
              {orientation === 'horizontal' && index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-6 transition-all duration-500",
                  step.id < currentStep ? "bg-gradient-to-r from-[#7f5efd] to-[#9f7aea]" : "bg-gray-300"
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Stepper

