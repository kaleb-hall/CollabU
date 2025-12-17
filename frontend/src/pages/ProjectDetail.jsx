import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Users,
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculatingSchedule, setCalculatingSchedule] = useState(false);

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
            style: {
              background: '#FEF3C7',
              color: '#92400E',
            }
          });
        });
      }
      
      // Show success info
      const schedule = result.schedule;
      toast.success(
        `✅ ${schedule.tasks.length} tasks scheduled!\n` +
        `📊 ${schedule.total_hours_needed}h needed, ${schedule.total_hours_available}h available\n` +
        `${schedule.is_achievable ? '✅ Deadline is achievable!' : '⚠️ Warning: Tight deadline!'}`,
        { duration: 6000 }
      );
      
      // Reload tasks to see updated schedule
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
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const daysUntilDeadline = Math.ceil(
    (new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
    blocked: tasks.filter(t => t.status === 'blocked'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            
            <button
              onClick={handleCalculateSchedule}
              disabled={calculatingSchedule}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles size={20} className={calculatingSchedule ? 'animate-spin' : ''} />
              {calculatingSchedule ? 'Calculating...' : 'Calculate Schedule ✨'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="card mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              daysUntilDeadline <= 7 
                ? 'bg-red-100 text-red-700'
                : daysUntilDeadline <= 14
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {daysUntilDeadline} days left
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckSquare className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks}/{totalTasks}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(project.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span className="font-medium">{completedTasks} of {totalTasks} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
            <button className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Add Task
            </button>
          </div>

          {totalTasks === 0 ? (
            <div className="card text-center py-12">
              <CheckSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tasks yet
              </h3>
              <p className="text-gray-600 mb-4">
                Add tasks to get started with smart scheduling!
              </p>
              <button className="btn-primary">
                Add Your First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <div key={status}>
                  <h3 className="font-semibold text-gray-900 mb-3 capitalize flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'in_progress' ? 'bg-blue-500' :
                      status === 'blocked' ? 'bg-red-500' :
                      status === 'review' ? 'bg-purple-500' :
                      'bg-gray-400'
                    }`} />
                    {status.replace('_', ' ')} ({statusTasks.length})
                  </h3>
                  <div className="space-y-3">
                    {statusTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task}
                        onStatusChange={updateTaskStatus}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onStatusChange }) {
  const [showActions, setShowActions] = useState(false);

  const priorityColors = {
    urgent: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50',
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' },
  ];

  return (
    <div 
      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${priorityColors[task.priority]} cursor-pointer`}
      onClick={() => setShowActions(!showActions)}
    >
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      
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
        
        <div className="flex items-center gap-2">
          <Clock size={14} />
          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
        </div>

        {task.estimated_hours && (
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
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
            className="input text-sm"
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

      <div className="mt-2 flex items-center justify-between">
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
