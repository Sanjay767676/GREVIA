// Grievia logo lockup: SNS College crest + wordmark.
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
        className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-amber-200"
        style={{ width: size, height: size }}
      >
        <img
          src="/SNSCT.png"
          alt="SNS College of Technology"
          width={size}
          height={size}
          className="h-full w-full rounded-full object-contain"
        />
      </span>
      {wordmark && (
        <div className="leading-tight">
          <p className="font-display text-[15px] font-extrabold tracking-tight text-stone-900">
            Grievia
          </p>
          {subtitle && <p className="text-[11px] font-medium text-amber-800/60">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
