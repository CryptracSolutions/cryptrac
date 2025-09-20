import * as React from "react"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

interface ChartWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  info?: string
  value?: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  height?: number | string
}

const ChartWrapper = React.forwardRef<HTMLDivElement, ChartWrapperProps>(
  ({
    className,
    title,
    subtitle,
    info,
    value,
    trend,
    height = 160,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-[16px]", className)}
        {...props}
      >
        {(title || subtitle || value) && (
          <div className="space-y-[4px]">
            {title && (
              <div className="flex items-center gap-[4px]">
                <span className="text-[14px] font-semibold text-[#30313D]">
                  {title}
                </span>
                {info && (
                  <button
                    type="button"
                    className="text-[#6A7383] hover:text-[#30313D] transition-colors"
                    title={info}
                  >
                    <Info className="h-[12px] w-[12px]" />
                  </button>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-[14px] text-[#6A7383]">
                {subtitle}
              </p>
            )}
            {value && (
              <div className="flex items-baseline gap-[8px]">
                <span className="text-[20px] font-bold text-[#30313D]">
                  {value}
                </span>
                {trend && (
                  <span className={cn(
                    "text-[12px] font-medium",
                    trend.direction === 'up' && "text-[#41C064]",
                    trend.direction === 'down' && "text-[#E35C5C]",
                    trend.direction === 'neutral' && "text-[#6A7383]"
                  )}>
                    {trend.direction !== 'neutral' && (trend.value > 0 ? '+' : '')}
                    {trend.value}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className="relative"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          {children}
        </div>
      </div>
    )
  }
)
ChartWrapper.displayName = "ChartWrapper"

interface SimpleLineChartProps {
  data: number[]
  color?: string
  strokeWidth?: number
  height?: number
  showGrid?: boolean
  showAxis?: boolean
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  color = "#635BFF",
  strokeWidth = 2,
  height = 120,
  showGrid = true,
  showAxis = false
}) => {
  if (!data || data.length === 0) return null

  const width = 260
  const padding = 16
  const chartWidth = width - (padding * 2)
  const chartHeight = height - (padding * 2)

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * chartWidth + padding
    const y = height - ((value - min) / range * chartHeight + padding)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="w-full h-full">
      {showGrid && (
        <>
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#D5DBE1"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#87919F"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#D5DBE1"
            strokeWidth={1}
          />
        </>
      )}

      {showAxis && (
        <>
          <text x={padding - 8} y={padding + 4} className="fill-[#30313D] text-[12px]" textAnchor="end">
            {max.toFixed(0)}
          </text>
          <text x={padding - 8} y={height - padding + 4} className="fill-[#30313D] text-[12px]" textAnchor="end">
            {min.toFixed(0)}
          </text>
        </>
      )}

      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface SimpleBarChartProps {
  data: number[]
  color?: string
  height?: number
  barWidth?: number
  showGrid?: boolean
  showAxis?: boolean
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  color = "#635BFF",
  height = 120,
  barWidth = 12,
  showGrid = true,
  showAxis = false
}) => {
  if (!data || data.length === 0) return null

  const width = 260
  const padding = 16
  const chartWidth = width - (padding * 2)
  const chartHeight = height - (padding * 2)

  const max = Math.max(...data)
  const barSpacing = chartWidth / data.length

  return (
    <svg width={width} height={height} className="w-full h-full">
      {showGrid && (
        <>
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#D5DBE1"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#87919F"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#D5DBE1"
            strokeWidth={1}
          />
        </>
      )}

      {showAxis && (
        <text x={padding - 8} y={padding + 4} className="fill-[#30313D] text-[12px]" textAnchor="end">
          {max.toFixed(0)}
        </text>
      )}

      {data.map((value, index) => {
        const barHeight = (value / max) * chartHeight
        const x = padding + (index * barSpacing) + (barSpacing - barWidth) / 2
        const y = height - padding - barHeight

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={2}
            ry={2}
          />
        )
      })}
    </svg>
  )
}

interface SparklineProps {
  data: number[]
  color?: string
  strokeWidth?: number
  height?: number
  width?: number
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = "#7f5efd",
  strokeWidth = 1.5,
  height = 40,
  width = 100
}) => {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range * height)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export {
  ChartWrapper,
  SimpleLineChart,
  SimpleBarChart,
  Sparkline
}