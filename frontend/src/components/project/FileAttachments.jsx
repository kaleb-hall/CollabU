import { DownloadSimple, File as FileIcon, Paperclip, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import Skeleton from '../ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useDeleteFile, useFiles, useUploadFile } from '../../hooks/useFiles';
import { fileService } from '../../services/fileService';
import { timeAgo } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { ALLOWED_EXTENSIONS, checkFile, formatSize } from '../../lib/files';

// Files on a project, or on one task when taskId is given.
// Only the uploader or the project owner (ownerId) can delete.
export default function FileAttachments({ projectId, taskId, ownerId }) {
  const { user } = useAuth();
  const files = useFiles(projectId, taskId);
  const upload = useUploadFile(projectId, taskId);
  const remove = useDeleteFile(projectId);
  const inputId = `attach-${projectId}-${taskId ?? 'project'}`;

  const onPick = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    const problem = checkFile(picked);
    if (problem) {
      toast.error(problem);
      return;
    }
    upload.mutate(picked, {
      onSuccess: () => toast.success(`Uploaded ${picked.name}`),
      onError: (error) => toast.error(getErrorMessage(error, 'Could not upload the file')),
    });
  };

  const download = (file) => {
    fileService.download(file).catch((error) => toast.error(getErrorMessage(error, 'Could not download the file')));
  };

  const canDelete = (file) => user && (file.uploader.id === user.id || ownerId === user.id);

  return (
    <section aria-label="Files" className="rounded-card border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h3 className="font-semibold text-ink">Files</h3>
        <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-ink-soft hover:text-ink">
          <Paperclip size={16} aria-hidden="true" />
          {upload.isPending ? 'Uploading...' : 'Attach a file'}
        </label>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
          onChange={onPick}
          disabled={upload.isPending}
        />
      </div>
      {files.isPending && <div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>}
      {files.isError && <p className="px-4 py-3 text-accent">{getErrorMessage(files.error)}</p>}
      {files.isSuccess && files.data.length === 0 && (
        <p className="px-4 py-6 text-center text-ink-soft">No files yet. PDFs, images, docs and spreadsheets up to 10 MB.</p>
      )}
      {files.isSuccess && files.data.length > 0 && (
        <ul>
          {files.data.map((file) => (
            <li key={file.id} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-b-0">
              <FileIcon size={20} className="shrink-0 text-ink-faint" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{file.filename}</span>
                <span className="block text-xs text-ink-faint">
                  <span className="font-mono">{formatSize(file.size)}</span>, {file.uploader.full_name}, {timeAgo(file.created_at)}
                </span>
              </span>
              <button type="button" onClick={() => download(file)} aria-label={`Download ${file.filename}`}
                className="rounded-sm p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink">
                <DownloadSimple size={18} aria-hidden="true" />
              </button>
              {canDelete(file) && (
                <button
                  type="button"
                  onClick={() => remove.mutate(file.id, {
                    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete the file')),
                  })}
                  aria-label={`Delete ${file.filename}`}
                  className="rounded-sm p-1.5 text-ink-soft hover:bg-paper-deep hover:text-accent"
                >
                  <Trash size={18} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
