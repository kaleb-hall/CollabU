// Every React Query key lives here so invalidation always matches.
export const queryKeys = {
  projects: ['projects'],
  project: (id) => ['projects', Number(id)],
  projectTasks: (projectId) => ['tasks', 'project', Number(projectId)],
  myTasks: ['tasks', 'mine'],
  calendarBlocks: ['calendar', 'blocks'],
  users: (search) => ['users', search],
}
