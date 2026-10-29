import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useAddComment, useComments, useDeleteComment } from '../hooks/useComments';
import { timeAgo } from '../lib/dates';
import { getErrorMessage } from '../lib/errors';

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

  const remove = (commentId) => {
    deleteComment.mutate(commentId, {
      onError: (error) => toast.error(getErrorMessage(error, 'Could not delete the comment')),
    });
  };

  return (
    <section aria-label="Comments" className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Comments</h3>
      {comments.isPending && <p className="text-sm text-gray-500">Loading comments...</p>}
      {comments.isError && <p className="text-sm text-red-600">{getErrorMessage(comments.error)}</p>}
      {comments.isSuccess && comments.data.length === 0 && (
        <p className="text-sm text-gray-500">No comments yet.</p>
      )}
      {comments.isSuccess && comments.data.length > 0 && (
        <ul className="space-y-3 max-h-60 overflow-y-auto">
          {comments.data.map((comment) => (
            <li key={comment.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900">{comment.author.full_name}</span>
                <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
              {comment.author.id === user?.id && (
                <button
                  type="button"
                  onClick={() => remove(comment.id)}
                  aria-label="Delete comment"
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor={`comment-${taskId}`} className="sr-only">Add a comment</label>
        <textarea
          id={`comment-${taskId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Write a comment"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
        />
        <button
          type="submit"
          disabled={!body.trim() || addComment.isPending}
          className="self-end px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </section>
  );
}
