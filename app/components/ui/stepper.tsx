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
    <div className={cn(
      "flex",
      orientation === 'horizontal' ? "flex-row items-center justify-between" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep
        const isUpcoming = step.id > currentStep

        return (
          <div key={step.id} className={cn(
            "flex items-center",
            orientation === 'horizontal' ? "flex-col text-center" : "flex-row space-x-3"
          )}>
            {/* Step Circle */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
              isCompleted && "bg-[#7f5efd] border-[#7f5efd] text-white",
              isCurrent && "border-[#7f5efd] text-[#7f5efd] bg-[#7f5efd]/10",
              isUpcoming && "border-gray-300 text-gray-400 bg-white"
            )}>
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{step.id}</span>
              )}
            </div>

            {/* Step Content */}
            <div className={cn(
              orientation === 'horizontal' ? "mt-2" : "flex-1"
            )}>
              <h3 className={cn(
                "text-sm font-medium",
                isCurrent && "text-[#7f5efd]",
                isCompleted && "text-gray-900",
                isUpcoming && "text-gray-400"
              )}>
                {step.title}
              </h3>
              {step.description && (
                <p className={cn(
                  "text-xs mt-1",
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
                "flex-1 h-0.5 mx-4 transition-all duration-200",
                step.id < currentStep ? "bg-[#7f5efd]" : "bg-gray-300"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper

