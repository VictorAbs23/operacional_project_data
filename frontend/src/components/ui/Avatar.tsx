import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '';

  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold ${sizes[size]} ${className}`}>
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}
