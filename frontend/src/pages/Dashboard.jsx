import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';
import { 
  FolderOpen, 
  CheckSquare, 
  Calendar, 
  Plus,
  Clock,
  Users,
  LogOut
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, tasksData] = await Promise.all([
        projectService.getProjects(),
        taskService.getMyTasks()
      ]);
      
      setProjects(projectsData.projects || []);
      setMyTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const upcomingTasks = myTasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const activeProjects = projects.filter(p => p.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CollabU</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.first_name}! 👋</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-blue-600">{activeProjects.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FolderOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Tasks</p>
                <p className="text-3xl font-bold text-orange-600">
                  {myTasks.filter(t => t.status !== 'completed').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <CheckSquare className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Due This Week</p>
                <p className="text-3xl font-bold text-red-600">
                  {myTasks.filter(t => {
                    const dueDate = new Date(t.due_date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return dueDate <= weekFromNow && t.status !== 'completed';
                  }).length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Calendar className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
              <button 
                onClick={() => navigate('/projects/new')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                New Project
              </button>
            </div>

            {activeProjects.length === 0 ? (
              <div className="card text-center py-12">
                <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first project to get started!
                </p>
                <button 
                  onClick={() => navigate('/projects/new')}
                  className="btn-primary"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks Sidebar */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Tasks</h2>
            
            {upcomingTasks.length === 0 ? (
              <div className="card text-center py-8">
                <CheckSquare className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-600">No upcoming tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, onClick }) {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const daysUntilDeadline = Math.ceil(
    (new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div 
      onClick={onClick}
      className="card cursor-pointer hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{project.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          daysUntilDeadline <= 7 
            ? 'bg-red-100 text-red-700'
            : daysUntilDeadline <= 14
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {daysUntilDeadline} days left
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} />
          <span>{completedTasks}/{totalTasks} tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{new Date(project.deadline).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task }) {
  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300',
  };

  const daysUntil = Math.ceil(
    (new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`card py-3 px-4 border-l-4 ${priorityColors[task.priority]}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1 line-clamp-1">
          {task.title}
        </h4>
        <span className="text-xs text-gray-600 ml-2">
          {daysUntil}d
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="capitalize">{task.priority}</span>
        <span>•</span>
        <span className="capitalize">{task.status.replace('_', ' ')}</span>
      </div>
    </div>
  );
}
