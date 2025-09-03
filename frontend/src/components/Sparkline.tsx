import { memo } from 'react'

interface SparklineProps {
  values: number[]
  height?: number
  color?: string
}

// Lightweight SVG sparkline
export const Sparkline = memo(({ values, height = 40, color = 'url(#gradSpark)' }: SparklineProps) => {
  if (!values.length) return <svg height={height} width={120}></svg>
  const w = 140
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points = values.map((v,i)=>{
    const x = (i/(values.length-1))*w
    const y = height - ((v - min)/span)* (height-4) - 2
    return `${x},${y}`
  }).join(' ')
  const last = values[values.length-1]
  return (
    <svg width={w} height={height} className="sparkline">
      <defs>
        <linearGradient id="gradSpark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="70%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={points} />
      <circle cx={(values.length-1)/(values.length-1)*w} cy={height - ((last - min)/span)*(height-4) - 2} r={3} fill="#fff" stroke="#2563eb" strokeWidth={2} />
    </svg>
  )
})
