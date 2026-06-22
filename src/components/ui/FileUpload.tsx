import { useCallback, useState, DragEvent } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) return `File too large. Max ${maxSizeMB}MB.`;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) return 'Invalid file type. Use PNG, JPG, or PDF.';
    return null;
  }, [maxSizeMB]);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);
    const fileArray = Array.from(newFiles);
    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) { setError(err); return; }
    }
    if (multiple) {
      onFilesChange([...files, ...fileArray]);
    } else {
      onFilesChange(fileArray.slice(0, 1));
    }
  }, [files, multiple, onFilesChange, validateFile]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
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
      <label className="label">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      {hint && <p className="text-xs text-text-muted -mt-1 mb-2">{hint}</p>}

      {(files.length === 0 || multiple) && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'border-primary bg-primary-50'
              : 'border-neutral-200 bg-neutral-50 hover:border-primary/50 hover:bg-primary-50/30'
            }`}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-${label.replace(/\s/g, '-')}`)?.click()}
        >
          <input
            id={`file-${label.replace(/\s/g, '-')}`}
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
          <p className="text-xs text-text-muted mt-1">PNG, JPG, PDF up to {maxSizeMB}MB</p>
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
