import * as React from "react"
import { cn } from "@/lib/utils"

interface FormGroupProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
  gap?: "sm" | "md" | "lg"
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ children, className, columns = 1, gap = "md" }, ref) => {
    const gapClasses = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6"
    }

    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {children}
      </div>
    )
  }
)
FormGroup.displayName = "FormGroup"

interface FormRowProps {
  children: React.ReactNode
  className?: string
  gap?: "sm" | "md" | "lg"
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ children, className, gap = "md" }, ref) => {
    const gapClasses = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row",
          gapClasses[gap],
          className
        )}
      >
        {children}
      </div>
    )
  }
)
FormRow.displayName = "FormRow"

export { FormGroup, FormRow }