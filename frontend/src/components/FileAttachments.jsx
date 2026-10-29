import { useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useDeleteFile, useFiles, useUploadFile } from '../hooks/useFiles';
import { fileService } from '../services/fileService';
import { timeAgo } from '../lib/dates';
import { getErrorMessage } from '../lib/errors';
import { ALLOWED_EXTENSIONS, checkFile, formatSize } from '../lib/files';

// Files on a project, or on one task when taskId is given.
// Only the uploader or the project owner (ownerId) can delete.
export default function FileAttachments({ projectId, taskId, ownerId }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
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
    <section aria-label="Files" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Files</h3>
        <label htmlFor={inputId} className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
          {upload.isPending ? 'Uploading...' : 'Attach a file'}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
          onChange={onPick}
          disabled={upload.isPending}
        />
      </div>
      {files.isPending && <p className="text-sm text-gray-500">Loading files...</p>}
      {files.isError && <p className="text-sm text-red-600">{getErrorMessage(files.error)}</p>}
      {files.isSuccess && files.data.length === 0 && (
        <p className="text-sm text-gray-500">No files yet. PDFs, images, docs and spreadsheets up to 10 MB.</p>
      )}
      {files.isSuccess && files.data.length > 0 && (
        <ul className="divide-y border rounded-lg">
          {files.data.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate text-gray-900">{file.filename}</span>
                <span className="block text-xs text-gray-500">
                  {formatSize(file.size)}, {file.uploader.full_name}, {timeAgo(file.created_at)}
                </span>
              </span>
              <span className="flex gap-3 shrink-0">
                <button type="button" onClick={() => download(file)} aria-label={`Download ${file.filename}`} className="text-blue-600">
                  Download
                </button>
                {canDelete(file) && (
                  <button
                    type="button"
                    onClick={() => remove.mutate(file.id, {
                      onError: (error) => toast.error(getErrorMessage(error, 'Could not delete the file')),
                    })}
                    aria-label={`Delete ${file.filename}`}
                    className="text-gray-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
