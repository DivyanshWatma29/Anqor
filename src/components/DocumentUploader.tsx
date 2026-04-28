import { useState, useCallback } from 'react';
import { m } from 'framer-motion';
import { Upload, FileText, Image, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentUploaderProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  result?: { success: boolean; error?: string } | null;
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentUploader = ({ onFileSelected, isProcessing, result }: DocumentUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback((file: File) => {
    setError(null);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, PNG, or WebP file');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 10MB');
      return;
    }
    setSelectedFile(file);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  }, [validateAndSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  }, [validateAndSelect]);

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <Image className="w-5 h-5" />;
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {!selectedFile ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border/50 hover:border-primary/50 hover:bg-secondary/30'
          }`}
        >
          <input
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Drop your claim document here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, JPG, PNG, or WebP — max 10MB
          </p>
        </label>
      ) : (
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {getFileIcon(selectedFile.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : result?.success ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : result && !result.success ? (
              <AlertCircle className="w-5 h-5 text-danger" />
            ) : null}
            {!isProcessing && (
              <button
                onClick={clearFile}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {isProcessing && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <m.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))]"
                  initial={{ width: '5%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 8, ease: 'easeOut' }}
                />
              </div>
              <span>Extracting fields with AI...</span>
            </div>
          )}
          {result && !result.success && (
            <p className="mt-2 text-xs text-danger">{result.error}</p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-danger text-center">{error}</p>
      )}
    </m.div>
  );
};

export default DocumentUploader;
