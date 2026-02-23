interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({ value, max = 100, showLabel = true, size = 'md', className = '' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const color = percent === 100 ? 'bg-accent-500' : percent > 0 ? 'bg-primary-500' : 'bg-neutral-300';

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-neutral-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div className={`${color} ${heights[size]} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-neutral-500 mt-1 block">{percent}%</span>
      )}
    </div>
  );
}
