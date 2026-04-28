import { useCallback, useState } from 'react';
import { m } from 'framer-motion';
import { Upload, FileSpreadsheet, FileText, Image, AlertCircle } from 'lucide-react';

export type ParsedFileResult = {
  type: 'csv';
  rows: Record<string, unknown>[];
  fileName: string;
} | {
  type: 'document';
  file: File;
  fileName: string;
};

interface FileDropzoneProps {
  onFileReady: (result: ParsedFileResult) => void;
  expectedHeaders: string[];
}

const ACCEPTED_TYPES = '.csv,.pdf,.jpg,.jpeg,.png,.webp';
const MAX_SIZE = 10 * 1024 * 1024;

const FileDropzone = ({ onFileReady, expectedHeaders }: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const processFile = useCallback(async (file: File) => {
    setError('');
    setFileName(file.name);

    if (file.size > MAX_SIZE) {
      setError('File must be under 10MB');
      return;
    }

    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (isCSV) {
      const Papa = await import('papaparse');
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parse error: ${results.errors[0].message}`);
            return;
          }
          const headers = results.meta.fields || [];
          const missing = expectedHeaders.filter((h) => !headers.includes(h));
          if (missing.length > 0) {
            setError(`Missing columns: ${missing.join(', ')}`);
            return;
          }
          if (results.data.length === 0) {
            setError('CSV file is empty');
            return;
          }
          onFileReady({ type: 'csv', rows: results.data as Record<string, unknown>[], fileName: file.name });
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    } else if (isPDF || isImage) {
      onFileReady({ type: 'document', file, fileName: file.name });
    } else {
      setError('Unsupported file type. Upload CSV, PDF, JPG, or PNG.');
    }
  }, [onFileReady, expectedHeaders]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const getIcon = () => {
    if (!fileName) return <Upload className="w-8 h-8 text-primary/60" />;
    if (fileName.endsWith('.csv')) return <FileSpreadsheet className="w-8 h-8 text-primary" />;
    if (fileName.endsWith('.pdf')) return <FileText className="w-8 h-8 text-primary" />;
    return <Image className="w-8 h-8 text-primary" />;
  };

  return (
    <div className="space-y-3">
      <m.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative glass-card-hover p-12 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-primary/50'
        }`}
      >
        <input
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-[hsl(var(--glow-purple))]/10 flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {fileName || 'Drop your file here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {fileName ? `${fileName} selected` : 'CSV, PDF, JPG, or PNG — max 10MB'}
            </p>
          </div>
        </div>
      </m.div>

      {error && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </m.div>
      )}
    </div>
  );
};

export default FileDropzone;
