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
    <div className={cn("relative", className)}>
      {/* Stepper */}
      <div className={cn(
        "flex",
        orientation === 'horizontal' ? "flex-row items-center justify-center gap-8" : "flex-col space-y-4"
      )}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep

          return (
            <div key={step.id} className={cn(
              "flex flex-col items-center transition-all duration-500 min-w-0",
              orientation === 'horizontal' ? "text-center flex-1 max-w-[200px]" : "flex-row space-x-3"
            )}>
              {/* Step Circle */}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-sm mb-3",
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
              <div className="flex flex-col items-center">
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
                    "text-xs mt-1 leading-relaxed text-center max-w-[160px]",
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

      {/* Connector Lines (separate from steps for better alignment) */}
      {orientation === 'horizontal' && (
        <div className="absolute top-6 left-0 right-0 flex justify-center items-center px-6">
          <div className="flex items-center justify-between w-full max-w-4xl">
            {steps.slice(0, -1).map((step, index) => (
              <div
                key={`connector-${index}`}
                className={cn(
                  "flex-1 h-0.5 transition-all duration-500",
                  step.id < currentStep ? "bg-gradient-to-r from-[#7f5efd] to-[#9f7aea]" : "bg-gray-300"
                )}
                style={{ marginLeft: '2rem', marginRight: '2rem' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Stepper

