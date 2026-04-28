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
  Clock,
  LogOut,
  Plus,
  Lightbulb,
  Code,
  FileText,
  Presentation,
  Users,
  FlaskConical,
  BookOpen,
  Video,
  LayoutGrid
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading your workspace...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.first_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Welcome, {user?.first_name} 👋</h1>
                <p className="text-sm text-gray-500">UC Santa Cruz</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">CollabU</h1>
              <button
                onClick={() => navigate('/calendar')}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Calendar size={20} />
                Calendar
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects - Left Side */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Active Projects</h2>
              <button
                onClick={() => setShowAddProject(true)}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus size={20} />
                New Project
              </button>
            </div>

            {activeProjects.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first project to get started!
                </p>
                <button
                  onClick={() => setShowAddProject(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-6">
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

          {/* Upcoming Tasks - Right Sidebar */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Upcoming Tasks</h2>
            
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-gray-600">No upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <UpcomingTaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Project Modal */}
      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onSuccess={() => {
            setShowAddProject(false);
            loadData();
          }}
        />
      )}
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

  const nextTask = project.tasks?.find(t => t.status !== 'completed');

  const getProgressColor = () => {
    if (progress >= 75) return 'bg-teal-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-purple-500';
    return 'bg-blue-400';
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h3>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar size={16} />
          <span>{daysUntilDeadline} days</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {nextTask && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Next:</span> {nextTask.title}
        </div>
      )}
    </div>
  );
}

// Upcoming Task Card
function UpcomingTaskCard({ task }) {
  const dueDate = new Date(task.due_date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = dueDate.toDateString() === today.toDateString();
  const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
  
  let timeString = '';
  if (isToday) {
    timeString = `Today, ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (isTomorrow) {
    timeString = `Tomorrow, ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    timeString = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="mt-1">
        <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
          {task.status === 'completed' && (
            <CheckSquare size={14} className="text-green-500" />
          )}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
        <p className="text-xs text-gray-500">{task.project?.title || 'Project'}</p>
        <p className="text-xs text-teal-600 mt-1">{timeString}</p>
      </div>
    </div>
  );
}

// Add Project Modal with Template Selector
function AddProjectModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  const templates = [
    {
      id: 'custom',
      name: 'Blank Project',
      description: 'Start from scratch with no pre-made tasks',
      icon: LayoutGrid,
      color: 'gray',
      estimatedHours: 0
    },
    {
      id: 'research_paper',
      name: 'Research Paper',
      description: 'Essay, thesis, academic paper, or report',
      icon: FileText,
      color: 'blue',
      estimatedHours: 44
    },
    {
      id: 'software_project',
      name: 'Software Project',
      description: 'App, website, or coding project',
      icon: Code,
      color: 'purple',
      estimatedHours: 77
    },
    {
      id: 'presentation',
      name: 'Presentation',
      description: 'Slide deck, pitch, or demo',
      icon: Presentation,
      color: 'teal',
      estimatedHours: 26
    },
    {
      id: 'group_project',
      name: 'Group Project',
      description: 'Team collaboration project',
      icon: Users,
      color: 'orange',
      estimatedHours: 36
    },
    {
      id: 'lab_experiment',
      name: 'Lab Report',
      description: 'Experiment and lab report',
      icon: FlaskConical,
      color: 'green',
      estimatedHours: 21
    },
    {
      id: 'study_guide',
      name: 'Exam Prep',
      description: 'Study for test, midterm, or final',
      icon: BookOpen,
      color: 'red',
      estimatedHours: 38
    },
    {
      id: 'video_project',
      name: 'Video Project',
      description: 'Film, documentary, or recording',
      icon: Video,
      color: 'pink',
      estimatedHours: 40
    },
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const autoGenerate = selectedTemplate?.id !== 'custom';
      
      console.log('Submitting project:', {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        auto_generate_tasks: autoGenerate
      });

      const response = await projectService.createProject({
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        auto_generate_tasks: autoGenerate
      });
      
      console.log('Project created:', response);
      
      toast.success(
        autoGenerate 
          ? `Project created with AI-generated tasks!`
          : 'Project created successfully!'
      );
      onSuccess();
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const colorClasses = {
    gray: 'bg-gray-100 border-gray-300 hover:border-gray-400 hover:bg-gray-200',
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
    teal: 'bg-teal-50 border-teal-200 hover:border-teal-400 hover:bg-teal-100',
    orange: 'bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100',
    green: 'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100',
    red: 'bg-red-50 border-red-200 hover:border-red-400 hover:bg-red-100',
    pink: 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:bg-pink-100',
  };

  const iconColorClasses = {
    gray: 'text-gray-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    red: 'text-red-600',
    pink: 'text-pink-600',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h2>
            <p className="text-gray-600 mb-6">Choose a template or start from scratch</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${colorClasses[template.color]}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${template.color === 'gray' ? 'bg-gray-200' : `bg-${template.color}-100`}`}>
                        <Icon className={iconColorClasses[template.color]} size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        {template.estimatedHours > 0 && (
                          <p className="text-xs text-gray-500">
                            ~{template.estimatedHours}h of work
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
                <p className="text-sm text-gray-600">
                  Template: <span className="font-semibold">{selectedTemplate?.name}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Final Research Paper"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Describe your project..."
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {selectedTemplate?.id !== 'custom' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        AI Task Generation Enabled
                      </p>
                      <p className="text-xs text-blue-700">
                        CollabU will automatically create {selectedTemplate?.estimatedHours > 0 ? `~${selectedTemplate.estimatedHours}h of ` : ''}tasks 
                        based on the {selectedTemplate?.name} template. You can edit or delete them after creation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
