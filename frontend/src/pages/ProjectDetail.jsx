import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Users,
  Sparkles,
  Plus,
  CheckSquare,
  Clock,
  UserPlus,
  Search,
  X
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculatingSchedule, setCalculatingSchedule] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getProject(id),
        taskService.getProjectTasks(id)
      ]);
      
      setProject(projectData.project);
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateSchedule = async () => {
    if (tasks.length === 0) {
      toast.error('Add some tasks first!');
      return;
    }

    setCalculatingSchedule(true);
    try {
      const result = await taskService.calculateSchedule(id);
      toast.success('🎯 Schedule calculated successfully!', { duration: 4000 });
      
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast(warning, { 
            icon: '⚠️',
            duration: 6000,
          });
        });
      }
      
      const tasksData = await taskService.getProjectTasks(id);
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Error calculating schedule:', error);
      toast.error('Failed to calculate schedule');
    } finally {
      setCalculatingSchedule(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      toast.success('Task updated!');
      
      // Update local state with current user info
      setTasks(tasks.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: newStatus,
          updated_at: new Date().toISOString()
        } : t
      ));
    } catch (error) {
      toast.error('Failed to update task');
    }
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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Only show the 3 visible columns
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const teamMembers = project.members || [];

  // Generate recent activity with current user's name
  const recentActivity = tasks
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8)
    .map(task => {
      const userName = task.assignee 
        ? `${task.assignee.first_name}` 
        : currentUser?.first_name || 'Someone';
      
      return {
        text: task.status === 'completed' 
          ? `${userName} completed ${task.title}`
          : task.status === 'in_progress'
          ? `${userName} started ${task.title}`
          : `${userName} updated ${task.title}`,
        time: getRelativeTime(task.updated_at),
        color: task.status === 'completed' ? 'teal' : 
               task.status === 'in_progress' ? 'blue' :
               'gray'
      };
    });
  
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
            
            <h1 className="text-2xl font-bold text-gray-900">CollabU</h1>
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
                  <span>Started: {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Due: {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculateSchedule}
              disabled={calculatingSchedule}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Sparkles size={20} className={calculatingSchedule ? 'animate-spin' : ''} />
              {calculatingSchedule ? 'Calculating...' : 'Calculate Schedule'}
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
              <h2 className="text-2xl font-bold text-white">Tasks</h2>
              <button
                onClick={() => setShowAddTask(true)}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus size={20} />
                Add Task
              </button>
            </div>

            {totalTasks === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TaskColumn
                  title="To Do"
                  tasks={tasksByStatus.todo}
                  color="gray"
                  onStatusChange={updateTaskStatus}
                  currentUser={currentUser}
                />
                <TaskColumn
                  title="In Progress"
                  tasks={tasksByStatus.in_progress}
                  color="blue"
                  onStatusChange={updateTaskStatus}
                  currentUser={currentUser}
                />
                <TaskColumn
                  title="Completed"
                  tasks={tasksByStatus.completed}
                  color="teal"
                  onStatusChange={updateTaskStatus}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="Add Team Member"
                >
                  <UserPlus size={20} />
                </button>
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

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-600">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <ActivityItem 
                      key={i}
                      color={activity.color}
                      text={activity.text}
                      time={activity.time}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          projectId={id}
          onClose={() => setShowAddTask(false)}
          onSuccess={() => {
            setShowAddTask(false);
            loadProjectData();
          }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          existingMembers={teamMembers}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            setShowAddMember(false);
            loadProjectData();
          }}
        />
      )}
    </div>
  );
}

// Task Column Component
function TaskColumn({ title, tasks, color, onStatusChange, currentUser }) {
  const colorClasses = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    teal: 'bg-teal-500',
  };

  return (
    <div>
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
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}

// Task Card Component - Only show 3 status options
function TaskCard({ task, onStatusChange, currentUser }) {
  const [showActions, setShowActions] = useState(false);

  const priorityColors = {
    urgent: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50',
  };

  // Only the 3 visible statuses
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border-l-4 ${priorityColors[task.priority]} cursor-pointer`}
      onClick={() => setShowActions(!showActions)}
    >
      <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
      
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
            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
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
            {statusOptions.map(option => (
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

// Activity Item Component
function ActivityItem({ color, text, time }) {
  const colorClasses = {
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${colorClasses[color]}`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

// Add Task Modal Component (same as before)
function AddTaskModal({ projectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    estimated_hours: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await taskService.createTask(projectId, {
        ...formData,
        due_date: new Date(formData.due_date).toISOString(),
        estimated_hours: parseFloat(formData.estimated_hours) || null,
      });
      
      toast.success('Task created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
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

// Add Member Modal Component (same as before - keeping for completeness)
function AddMemberModal({ projectId, existingMembers, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      const existingUserIds = existingMembers.map(m => m.user_id);
      const availableUsers = response.users.filter(u => !existingUserIds.includes(u.id));
      setAllUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setSubmitting(true);
    try {
      await projectService.addMember(projectId, {
        user_id: selectedUser.id,
        role: selectedRole
      });
      
      toast.success('Team member added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Team Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Search by name or email"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-600">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-600">
                {searchQuery ? 'No users found' : 'All users are already members'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {user.first_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {selectedUser?.id === user.id && (
                        <CheckSquare className="text-blue-600" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedRole === 'admin' && 'Can manage project, tasks, and members'}
                {selectedRole === 'member' && 'Can view and update tasks'}
                {selectedRole === 'viewer' && 'Can only view project'}
              </p>
            </div>
          )}

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
              disabled={submitting || !selectedUser}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function for relative time
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return date.toLocaleDateString();
}
