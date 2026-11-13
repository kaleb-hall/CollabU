import { useState } from 'react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import { inputClass } from '../ui/Field';
import { useAuth } from '../../hooks/useAuth';
import { useAddComment, useComments, useDeleteComment } from '../../hooks/useComments';
import { timeAgo } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';

// Comments on a task, oldest first; only the author can delete theirs
export default function TaskComments({ taskId, projectId }) {
  const { user } = useAuth();
  const comments = useComments(taskId);
  const addComment = useAddComment(taskId, projectId);
  const deleteComment = useDeleteComment(taskId, projectId);
  const [body, setBody] = useState('');

  const submit = (e) => {
    e.preventDefault();
    addComment.mutate(body.trim(), {
      onSuccess: () => setBody(''),
      onError: (error) => toast.error(getErrorMessage(error, 'Could not post the comment')),
    });
  };

  return (
    <section aria-label="Comments" className="space-y-3">
      <h3 className="font-semibold text-ink">Comments</h3>
      {comments.isPending && <p className="text-ink-soft">Loading comments...</p>}
      {comments.isError && <p className="text-accent">{getErrorMessage(comments.error)}</p>}
      {comments.isSuccess && comments.data.length === 0 && <p className="text-ink-soft">No comments yet.</p>}
      {comments.isSuccess && comments.data.length > 0 && (
        <ul className="space-y-3">
          {comments.data.map((comment) => (
            <li key={comment.id} className="group">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-ink">{comment.author.full_name}</span>
                <span className="font-mono text-xs text-ink-faint">{timeAgo(comment.created_at)}</span>
                {comment.author.id === user?.id && (
                  <button
                    type="button"
                    onClick={() => deleteComment.mutate(comment.id, {
                      onError: (error) => toast.error(getErrorMessage(error, 'Could not delete the comment')),
                    })}
                    aria-label="Delete comment"
                    className="ml-auto text-xs font-semibold text-ink-faint hover:text-accent"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-ink-soft">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        <label htmlFor={`comment-${taskId}`} className="sr-only">Add a comment</label>
        <textarea
          id={`comment-${taskId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Write a comment"
          className={inputClass}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!body.trim() || addComment.isPending}>Post</Button>
        </div>
      </form>
    </section>
  );
}
