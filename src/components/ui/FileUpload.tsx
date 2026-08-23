import { useCallback, useState, useRef, DragEvent } from 'react';
import { Upload, X, FileText, Image, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesChange: (files: File[]) => void;
  files: File[];
  required?: boolean;
  hint?: string;
}

export function FileUpload({
  label,
  accept = 'image/*,.pdf',
  multiple = false,
  maxSizeMB = 10,
  onFilesChange,
  files,
  required = false,
  hint,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) return `File "${file.name}" is too large. Max ${maxSizeMB}MB.`;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp', 'application/pdf'];
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      return `Invalid file type for "${file.name}". Use PNG, JPG, HEIC, WebP, or PDF.`;
    }
    return null;
  }, [maxSizeMB]);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);
    const fileArray = Array.from(newFiles);
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        valid.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (valid.length > 0) {
      if (multiple) {
        onFilesChange([...files, ...valid]);
      } else {
        onFilesChange(valid.slice(0, 1));
      }
    }
  }, [files, multiple, onFilesChange, validateFile]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText size={16} className="text-error" />;
    return <Image size={16} className="text-primary" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-2">
      <label className="label text-sm font-semibold text-text-primary flex items-center justify-between">
        <span>{label} {required && <span className="text-error">*</span>}</span>
      </label>

      {hint && <p className="text-xs text-text-muted -mt-1 mb-2">{hint}</p>}

      {(files.length === 0 || multiple) && (
        <div
          role="button"
          tabIndex={0}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'border-primary bg-primary-50'
              : 'border-neutral-200 bg-neutral-50 hover:border-primary/50 hover:bg-primary-50/30'
            }`}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Upload size={24} className="mx-auto mb-2 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">
            Drop files here or <span className="text-primary">click to browse</span>
          </p>
          <p className="text-xs text-text-muted mt-1">PNG, JPG, HEIC, WebP, PDF up to {maxSizeMB}MB</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-success-light border border-success/20 rounded-xl"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                <p className="text-xs text-text-muted">{formatSize(file.size)}</p>
              </div>
              <CheckCircle size={16} className="text-success flex-shrink-0" />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="p-1 hover:bg-white rounded-lg transition-colors"
                type="button"
              >
                <X size={14} className="text-text-muted" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
