import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { calendarService } from '../services/calendarService';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  X,
  CheckSquare,
  Users
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [calendarBlocks, setCalendarBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      const [tasksData, projectsData, blocksData] = await Promise.all([
        taskService.getMyTasks(),
        projectService.getProjects(),
        calendarService.getCalendarBlocks()
      ]);

      setMyTasks(tasksData.tasks || []);
      setProjects(projectsData.projects || []);
      setCalendarBlocks(blocksData.blocks || []);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  // Convert tasks and blocks to calendar events
  const events = useMemo(() => {
    const taskEvents = myTasks.map(task => {
      const project = projects.find(p => p.id === task.project_id);
      const startDate = task.start_date ? new Date(task.start_date) : new Date(task.due_date);
      const endDate = new Date(task.due_date);

      return {
        id: `task-${task.id}`,
        title: task.title,
        start: startDate,
        end: endDate,
        type: 'task',
        data: task,
        project: project,
        color: getProjectColor(task.project_id),
        status: task.status,
        priority: task.priority,
      };
    });

    const blockEvents = calendarBlocks.map(block => ({
      id: `block-${block.id}`,
      title: block.title,
      start: new Date(block.start_time),
      end: new Date(block.end_time),
      type: 'block',
      data: block,
      color: getBlockColor(block.block_type),
      blockType: block.block_type,
    }));

    return [...taskEvents, ...blockEvents];
  }, [myTasks, projects, calendarBlocks]);

  const getProjectColor = (projectId) => {
    const colors = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
    return colors[projectId % colors.length];
  };

  const getBlockColor = (blockType) => {
    const colors = {
      busy: '#6b7280',
      class: '#3b82f6',
      work: '#14b8a6',
      sleep: '#8b5cf6',
      meeting: '#f59e0b',
      other: '#6b7280',
    };
    return colors[blockType] || '#6b7280';
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedDate(start);
    setShowAddBlock(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.color,
      borderRadius: '6px',
      opacity: event.status === 'completed' ? 0.6 : 1,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '12px',
      padding: '2px 5px',
    };

    if (event.type === 'block') {
      style.opacity = 0.4;
      style.border = `2px dashed ${event.color}`;
      style.backgroundColor = 'transparent';
      style.color = event.color;
    }

    return { style };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading calendar...</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            </div>

            <button
              onClick={() => setShowAddBlock(true)}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus size={20} />
              Add Busy Time
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar - 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6" style={{ height: '700px' }}>
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="week"
              />
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Legend */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Legend</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Tasks by Project</p>
                  {projects.slice(0, 6).map((project, i) => (
                    <div key={project.id} className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getProjectColor(project.id) }}
                      />
                      <span className="text-sm text-gray-600 truncate">{project.title}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Busy Times</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-blue-500" />
                    <span className="text-sm text-gray-600">Class</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-teal-500" />
                    <span className="text-sm text-gray-600">Work</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-purple-500" />
                    <span className="text-sm text-gray-600">Sleep</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-gray-500" />
                    <span className="text-sm text-gray-600">Other</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming This Week */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">This Week</h3>
              <div className="space-y-3">
                {myTasks
                  .filter(task => {
                    const dueDate = new Date(task.due_date);
                    const now = new Date();
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return dueDate >= now && dueDate <= weekFromNow && task.status !== 'completed';
                  })
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-2">
                        <CheckSquare size={16} className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(task.due_date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                {myTasks.filter(t => {
                  const dueDate = new Date(t.due_date);
                  const now = new Date();
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  return dueDate >= now && dueDate <= weekFromNow && t.status !== 'completed';
                }).length === 0 && (
                  <p className="text-sm text-gray-500">No tasks this week</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={async () => {
            if (selectedEvent.type === 'block') {
              try {
                await calendarService.deleteCalendarBlock(selectedEvent.data.id);
                toast.success('Busy time deleted');
                loadCalendarData();
                setSelectedEvent(null);
              } catch (error) {
                toast.error('Failed to delete');
              }
            }
          }}
        />
      )}

      {/* Add Block Modal */}
      {showAddBlock && (
        <AddBlockModal
          initialDate={selectedDate}
          onClose={() => setShowAddBlock(false)}
          onSuccess={() => {
            setShowAddBlock(false);
            loadCalendarData();
          }}
        />
      )}
    </div>
  );
}

// Event Detail Modal
function EventDetailModal({ event, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {event.type === 'task' ? (
            <>
              {event.data.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{event.data.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Project</p>
                <p className="text-sm text-gray-600">{event.project?.title || 'No project'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'completed' ? 'bg-teal-100 text-teal-700' :
                    event.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    event.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    event.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {event.priority}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Due Date</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>{event.end.toLocaleString()}</span>
                </div>
              </div>

              {event.data.estimated_hours && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Estimated Hours</p>
                  <p className="text-sm text-gray-600">{event.data.estimated_hours}h</p>
                </div>
              )}

              {event.data.assignee && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {event.data.assignee.first_name} {event.data.assignee.last_name}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {event.data.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{event.data.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Type</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                  {event.blockType}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Time</p>
                <div className="text-sm text-gray-600">
                  <p>{event.start.toLocaleString()}</p>
                  <p className="text-gray-500">to</p>
                  <p>{event.end.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={onDelete}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Delete Busy Time
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Add Block Modal
function AddBlockModal({ initialDate, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
    end_time: format(addHours(initialDate, 1), "yyyy-MM-dd'T'HH:mm"),
    block_type: 'busy',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await calendarService.createCalendarBlock({
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      });

      toast.success('Busy time added!');
      onSuccess();
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Failed to add busy time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Busy Time</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., CS 101 Class"
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
              placeholder="Optional description"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={formData.block_type}
              onChange={(e) => setFormData({ ...formData, block_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="busy">Busy</option>
              <option value="class">Class</option>
              <option value="work">Work</option>
              <option value="sleep">Sleep</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
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
              {loading ? 'Adding...' : 'Add Busy Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
