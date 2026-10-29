// Every React Query key lives here so invalidation always matches.
export const queryKeys = {
  projects: ['projects'],
  project: (id) => ['projects', Number(id)],
  projectTasks: (projectId) => ['tasks', 'project', Number(projectId)],
  myTasks: ['tasks', 'mine'],
  calendarBlocks: ['calendar', 'blocks'],
  activity: (projectId) => ['activity', Number(projectId)],
  notifications: ['notifications'],
  unreadCount: ['notifications', 'unread'],
  notificationList: ['notifications', 'list'],
  invite: (token) => ['invite', token],
  projectInvites: (projectId) => ['invites', Number(projectId)],
  comments: (taskId) => ['comments', Number(taskId)],
}
