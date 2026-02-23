interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function Card({ children, className = '', padding = 'md', interactive = false }: CardProps) {
  const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-6' };
  const interactiveClass = interactive
    ? 'hover:shadow-lg hover:translate-y-[-1px] transition-all cursor-pointer'
    : 'transition-shadow';
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 shadow-md ${paddings[padding]} ${interactiveClass} ${className}`}>
      {children}
    </div>
  );
}
