import { useEffect, useState } from 'react';
import { Icon } from './Icon';

// Photo picker with a local preview. Works with the mobile camera/gallery
// because the file input uses accept="image/*".
export function ImagePicker({
  id,
  file,
  onSelect,
}: {
  id: string;
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          onSelect(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />

      {file && preview ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-white p-2.5">
          <img
            src={preview}
            alt="Selected photo preview"
            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-amber-200"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-800">{file.name}</p>
            <p className="text-[11px] text-stone-400">
              {(file.size / (1024 * 1024)).toFixed(1)} MB &middot; ready to upload
            </p>
          </div>
          <label
            htmlFor={id}
            className="cursor-pointer rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-50"
          >
            Replace
          </label>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 px-4 py-3 transition-colors hover:border-amber-400 hover:bg-amber-50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-amber-700 ring-1 ring-amber-200">
            <Icon name="plus" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-stone-800">
              Add a photo
            </span>
            <span className="block text-[11px] text-stone-400">
              PNG, JPG or WebP, up to 8 MB
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
