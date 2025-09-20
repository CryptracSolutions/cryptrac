import * as React from "react"
import { cn } from "@/lib/utils"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  disabled?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, disabled, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-sm font-semibold text-[#30313d] tracking-[-0.154px] leading-5",
        disabled && "opacity-70 cursor-not-allowed text-[#a3acba]",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-[#e85d75]" aria-label="required">
          *
        </span>
      )}
    </label>
  )
)
Label.displayName = "Label"

export { Label }

