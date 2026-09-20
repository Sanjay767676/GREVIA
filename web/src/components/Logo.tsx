import Image from 'next/image';

// Grievia logo lockup: SNS College crest + wordmark. `size` controls the crest
// diameter in px; `subtitle` optionally shown under the wordmark.
export function Logo({
  size = 36,
  subtitle,
  wordmark = true,
}: {
  size?: number;
  subtitle?: string;
  wordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid shrink-0 place-items-center rounded-full bg-white ring-1 ring-slate-200"
        style={{ width: size, height: size }}
      >
        <Image
          src="/SNSCT.png"
          alt="SNS College of Technology"
          width={size}
          height={size}
          className="rounded-full object-contain"
          priority
        />
      </span>
      {wordmark && (
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-tight text-slate-900">
            Grievia
          </p>
          {subtitle && (
            <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
