import { CheckCircle2, Clock, Loader2, AlertTriangle, Zap, FileEdit, Archive, Info } from 'lucide-react';

interface BadgeProps {
  variant?: 'completed' | 'inProgress' | 'notStarted' | 'expired' | 'active' | 'draft' | 'closed' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<string, { style: string; Icon: React.ComponentType<{ className?: string }> }> = {
  completed: { style: 'bg-[#E8F9EF] text-[#0D7A3E]', Icon: CheckCircle2 },
  inProgress: { style: 'bg-primary-50 text-[#114D7C]', Icon: Loader2 },
  notStarted: { style: 'bg-neutral-100 text-neutral-700', Icon: Clock },
  expired: { style: 'bg-red-50 text-[#DC2626]', Icon: AlertTriangle },
  active: { style: 'bg-[#E8F9EF] text-[#0D7A3E]', Icon: Zap },
  draft: { style: 'bg-[#FFF8E1] text-[#92400E]', Icon: FileEdit },
  closed: { style: 'bg-neutral-100 text-neutral-700', Icon: Archive },
  info: { style: 'bg-primary-50 text-primary-500', Icon: Info },
};

export function Badge({ variant = 'info', children, className = '' }: BadgeProps) {
  const { style, Icon } = variantConfig[variant] || variantConfig.info;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style} ${className}`}>
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}
