import { X, File, Image, FileText, Music, Video } from 'lucide-react';
import { Button } from './ui/button';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface FilePreviewProps {
  file: FileAttachment;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function FilePreview({ file, onRemove, showRemove = false }: FilePreviewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('text') || type.includes('document')) return FileText;
    return File;
  };

  const IconComponent = getFileIcon(file.type);
  const isImage = file.type.startsWith('image/');

  return (
    <div className="relative bg-muted rounded-lg p-3 border border-border">
      {showRemove && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <div className="flex items-center gap-3">
        {isImage ? (
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-accent flex-shrink-0">
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <IconComponent className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
    </div>
  );
}