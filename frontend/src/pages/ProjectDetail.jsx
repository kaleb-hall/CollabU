import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProjects';
import { useCalculateSchedule, useCreateTask, useMoveTask, useProjectTasks, useUpdateTask } from '../hooks/useTasks';
import { formatDate, formatShortDate, fromInputValue, toInputValue, userTimeZone } from '../lib/dates';
import { getErrorMessage } from '../lib/errors';
import toast from 'react-hot-toast';
import ActivityFeed from '../components/ActivityFeed';
import InviteMemberModal from '../components/InviteMemberModal';
import NotificationBell from '../components/NotificationBell';
import TaskComments from '../components/TaskComments';
import FileAttachments from '../components/FileAttachments';
import WorkloadView from '../components/WorkloadView';

const STATUS_COLUMNS = [
  { value: 'todo', label: 'To Do', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'review', label: 'Review', color: 'purple' },
  { value: 'blocked', label: 'Blocked', color: 'red' },
  { value: 'completed', label: 'Completed', color: 'teal' },
];
import {
  ArrowLeft,
  Calendar,
  Users,
  Sparkles,
  Plus,
  CheckSquare,
  Clock,
  UserPlus,
  Edit2
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const projectQuery = useProject(id);
  const tasksQuery = useProjectTasks(id);
  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];
  const loading = projectQuery.isPending || tasksQuery.isPending;
  const loadError = projectQuery.error || tasksQuery.error;

  const schedule = useCalculateSchedule(id);
  const moveTask = useMoveTask(id);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [view, setView] = useState('board');

  const handleCalculateSchedule = () => {
    if (tasks.length === 0) {
      toast.error('Add some tasks first');
      return;
    }
    schedule.mutate(userTimeZone(), {
      onSuccess: (result) => {
        toast.success('Schedule calculated');
        result.warnings.forEach((warning) => toast(warning, { duration: 6000 }));
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not calculate the schedule')),
    });
  };

  const updateTaskStatus = (taskId, status) => {
    moveTask.mutate({ taskId, status }, {
      onError: (error) => toast.error(getErrorMessage(error, 'Could not move the task')),
    });
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowEditTask(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading project...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm">
          <p className="text-gray-900 font-semibold mb-2">Could not open this project</p>
          <p className="text-sm text-gray-600 mb-4">{getErrorMessage(loadError)}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;


  const teamMembers = project.members || [];
  const isAdmin = teamMembers.some((m) => m.user_id === currentUser?.id && m.role === 'admin');


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500 relative overflow-hidden">
      {/* Diagonal Stripe Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)'
        }}></div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Back to Projects
            </button>
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <h1 className="text-2xl font-bold text-gray-900">CollabU</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        {/* Project Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{teamMembers.length} Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Started: {formatDate(project.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Due: {formatDate(project.deadline)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculateSchedule}
              disabled={schedule.isPending}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Sparkles size={20} className={schedule.isPending ? 'animate-spin' : ''} />
              {schedule.isPending ? 'Calculating...' : 'Calculate Schedule'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-semibold">Overall Progress: {Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-teal-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tasks Section - 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div role="tablist" aria-label="Project views" className="flex gap-2">
                {[['board', 'Board'], ['workload', 'Workload']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={view === value}
                    onClick={() => setView(value)}
                    className={`px-4 py-2 rounded-xl font-semibold ${view === value ? 'bg-white text-gray-900' : 'text-white hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddTask(true)}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus size={20} />
                Add Task
              </button>
            </div>

            {view === 'workload' ? (
              <WorkloadView projectId={id} />
            ) : totalTasks === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <CheckSquare className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-600 mb-4">Add tasks to get started with smart scheduling!</p>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Add Your First Task
                </button>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {STATUS_COLUMNS.map((column) => (
                  <TaskColumn
                    key={column.value}
                    title={column.label}
                    tasks={tasks.filter((t) => t.status === column.value)}
                    color={column.color}
                    onStatusChange={updateTaskStatus}
                    onEditTask={handleEditTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label="Invite a teammate"
                  >
                    <UserPlus size={20} />
                  </button>
                )}
              </div>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-gray-600">No team members yet</p>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member, i) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        i % 4 === 0 ? 'bg-blue-500' :
                        i % 4 === 1 ? 'bg-teal-500' :
                        i % 4 === 2 ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}>
                        {member.user?.first_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {member.user?.first_name} {member.user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <FileAttachments projectId={id} ownerId={project.created_by} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
              <ActivityFeed projectId={id} />
            </div>
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          projectId={id}
          onClose={() => setShowAddTask(false)}
          onSuccess={() => setShowAddTask(false)}
        />
      )}

      {/* Edit Task Modal */}
      {showEditTask && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          ownerId={project.created_by}
          onClose={() => {
            setShowEditTask(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            setShowEditTask(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showInvite && <InviteMemberModal projectId={id} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

// Task Column Component
function TaskColumn({ title, tasks, color, onStatusChange, onEditTask }) {
  const colorClasses = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    teal: 'bg-teal-500',
  };

  return (
    <div className="min-w-[16rem] flex-1">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
        {title} ({tasks.length})
      </h3>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task}
            onStatusChange={onStatusChange}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onStatusChange, onEditTask }) {
  const [showActions, setShowActions] = useState(false);

  const priorityColors = {
    urgent: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50',
  };


  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border-l-4 ${priorityColors[task.priority]} cursor-pointer relative group`}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEditTask(task);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg"
        title="Edit task"
      >
        <Edit2 size={16} className="text-gray-600" />
      </button>

      <h4 className="font-semibold text-gray-900 mb-2 pr-8">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2 text-xs text-gray-600">
        {task.assignee && (
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{task.assignee.first_name} {task.assignee.last_name}</span>
          </div>
        )}
        
        {task.due_date && (
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>Due: {formatShortDate(task.due_date)}</span>
          </div>
        )}

        {task.estimated_hours && (
          <div className="flex items-center gap-2">
            <CheckSquare size={14} />
            <span>{task.estimated_hours}h estimated</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t">
          <select
            value={task.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_COLUMNS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

// Add Task Modal Component
function AddTaskModal({ projectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    estimated_hours: '',
    priority: 'medium',
  });
  const createTask = useCreateTask(projectId);
  const loading = createTask.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    createTask.mutate({
      ...formData,
      due_date: fromInputValue(formData.due_date),
      estimated_hours: parseFloat(formData.estimated_hours) || null,
    }, {
      onSuccess: () => {
        toast.success('Task created');
        onSuccess();
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not create the task')),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Task Modal Component
function EditTaskModal({ task, ownerId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    due_date: toInputValue(task.due_date),
    estimated_hours: task.estimated_hours || '',
    priority: task.priority || 'medium',
  });
  const updateTask = useUpdateTask(task.project_id);
  const loading = updateTask.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTask.mutate({
      taskId: task.id,
      changes: {
        ...formData,
        due_date: fromInputValue(formData.due_date),
        estimated_hours: parseFloat(formData.estimated_hours) || null,
      },
    }, {
      onSuccess: () => {
        toast.success('Task updated');
        onSuccess();
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not update the task')),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Task details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t">
          <FileAttachments projectId={task.project_id} taskId={task.id} ownerId={ownerId} />
        </div>

        <div className="mt-6 pt-6 border-t">
          <TaskComments taskId={task.id} projectId={task.project_id} />
        </div>
      </div>
    </div>
  );
}
