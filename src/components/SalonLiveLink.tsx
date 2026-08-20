import type { CSSProperties } from 'react';
import { ExternalLink } from 'lucide-react';
import type { SalonData } from '../types';
import { salonLiveHost, salonLiveUrl } from '../lib/salonSubdomain';

interface Props {
  data: Pick<SalonData, 'salonName'>;
  className?: string;
  style?: CSSProperties;
  iconClassName?: string;
}

/** The shared external link used by preview address bars. */
export default function SalonLiveLink({
  data,
  className = '',
  style,
  iconClassName = 'h-3 w-3',
}: Props) {
  return (
    <a
      href={salonLiveUrl(data)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1 cursor-pointer transition-colors hover:underline hover:opacity-80 ${className}`}
      style={style}
      aria-label={`Open ${salonLiveHost(data)} in a new tab`}
    >
      <span className="truncate">{salonLiveHost(data)}</span>
      <ExternalLink className={`${iconClassName} shrink-0`} aria-hidden="true" />
    </a>
  );
}
