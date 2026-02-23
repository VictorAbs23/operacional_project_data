import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { useLanguageStore } from '../../stores/languageStore';

interface DropZoneProps {
  onFile: (file: File) => void;
  preview?: string | null;
  onClear?: () => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function DropZone({ onFile, preview, onClear, accept, maxSize = 5 * 1024 * 1024 }: DropZoneProps) {
  const t = useLanguageStore((s) => s.t);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) onFile(accepted[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize,
    multiple: false,
  });

  if (preview) {
    return (
      <div className="relative inline-block">
        <img src={preview} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-neutral-200" />
        {onClear && (
          <button onClick={onClear} className="absolute -top-2 -right-2 bg-white rounded-full shadow-md p-1 hover:bg-neutral-50">
            <X className="h-3 w-3 text-neutral-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-500 hover:bg-neutral-50'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
      <p className="text-sm text-neutral-500">
        {isDragActive ? t('passenger.photo') : t('common.dropzone')}
      </p>
      <p className="text-xs text-neutral-400 mt-1">{t('common.dropzoneMaxSize')}</p>
    </div>
  );
}
