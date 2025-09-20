import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  helpText?: string
  showCount?: boolean
  maxCount?: number
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helpText, showCount, maxCount, autoResize, disabled, ...props }, ref) => {
    const textareaId = React.useId()
    const [charCount, setCharCount] = React.useState(props.defaultValue?.toString().length || 0)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)

      if (autoResize) {
        e.target.style.height = 'auto'
        e.target.style.height = `${e.target.scrollHeight}px`
      }

      if (props.onChange) {
        props.onChange(e)
      }
    }

    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [autoResize])

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-[#30313d] mb-1 tracking-[-0.154px]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            ref={textareaRef}
            disabled={disabled}
            className={cn(
              "flex min-h-[80px] w-full rounded bg-white px-2 py-1 text-sm font-normal tracking-[-0.154px] placeholder:text-[#a3acba] transition-all duration-200 resize-y",
              "border border-[#e3e8ee] shadow-[0px_2px_5px_0px_rgba(60,66,87,0.12),0px_1px_1px_0px_rgba(0,0,0,0.08)]",
              "hover:border-[#d5dbe1]",
              "focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:ring-offset-0 focus:border-[#7f5efd] focus:shadow-[0px_2px_5px_0px_rgba(127,94,253,0.12),0px_1px_1px_0px_rgba(127,94,253,0.08)]",
              "disabled:bg-[#f6f9fc] disabled:border-[#e3e8ee] disabled:text-[#a3acba] disabled:cursor-not-allowed disabled:opacity-75 disabled:resize-none",
              error && "border-[#e85d75] hover:border-[#e85d75] focus:ring-[#e85d75] focus:border-[#e85d75]",
              autoResize && "resize-none overflow-hidden",
              className
            )}
            onChange={handleChange}
            {...props}
          />
        </div>
        {(helpText || error || showCount) && (
          <div className="mt-1 flex items-center justify-between">
            <div>
              {helpText && !error && (
                <p className="text-xs text-[#6a7383] tracking-[-0.154px]">{helpText}</p>
              )}
              {error && (
                <p className="text-xs text-[#e85d75] tracking-[-0.154px]">{error}</p>
              )}
            </div>
            {showCount && (
              <span className={cn(
                "text-xs tracking-[-0.154px]",
                maxCount && charCount > maxCount ? "text-[#e85d75]" : "text-[#6a7383]"
              )}>
                {charCount}{maxCount ? `/${maxCount}` : ''}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

