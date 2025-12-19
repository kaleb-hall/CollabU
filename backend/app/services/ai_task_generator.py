import re
from datetime import datetime, timedelta

class AITaskGenerator:
    """
    Intelligent task generation based on project type and description.
    Uses pattern matching and domain knowledge to suggest relevant tasks.
    """
    
    # Project type patterns and their associated tasks
    PROJECT_TEMPLATES = {
        'research_paper': {
            'patterns': ['research paper', 'essay', 'thesis', 'dissertation', 'academic paper', 'report'],
            'tasks': [
                {'title': 'Topic selection and approval', 'hours': 2, 'priority': 'high', 'order': 1},
                {'title': 'Literature review and source gathering', 'hours': 8, 'priority': 'high', 'order': 2},
                {'title': 'Create outline and structure', 'hours': 3, 'priority': 'high', 'order': 3},
                {'title': 'Write introduction', 'hours': 4, 'priority': 'medium', 'order': 4},
                {'title': 'Write main body sections', 'hours': 12, 'priority': 'high', 'order': 5},
                {'title': 'Write conclusion', 'hours': 3, 'priority': 'medium', 'order': 6},
                {'title': 'Create bibliography/references', 'hours': 2, 'priority': 'medium', 'order': 7},
                {'title': 'First draft review and editing', 'hours': 4, 'priority': 'medium', 'order': 8},
                {'title': 'Peer review/feedback', 'hours': 2, 'priority': 'low', 'order': 9},
                {'title': 'Final revisions and proofreading', 'hours': 3, 'priority': 'high', 'order': 10},
                {'title': 'Format and submit', 'hours': 1, 'priority': 'high', 'order': 11},
            ]
        },
        'software_project': {
            'patterns': ['software', 'app', 'application', 'website', 'web app', 'mobile app', 'program', 'coding', 'development'],
            'tasks': [
                {'title': 'Requirements gathering and analysis', 'hours': 4, 'priority': 'high', 'order': 1},
                {'title': 'Design system architecture', 'hours': 6, 'priority': 'high', 'order': 2},
                {'title': 'Create UI/UX mockups', 'hours': 8, 'priority': 'medium', 'order': 3},
                {'title': 'Set up development environment', 'hours': 2, 'priority': 'high', 'order': 4},
                {'title': 'Database design and setup', 'hours': 4, 'priority': 'high', 'order': 5},
                {'title': 'Implement backend API', 'hours': 16, 'priority': 'high', 'order': 6},
                {'title': 'Build frontend UI', 'hours': 16, 'priority': 'high', 'order': 7},
                {'title': 'Integrate frontend and backend', 'hours': 6, 'priority': 'high', 'order': 8},
                {'title': 'Write unit tests', 'hours': 8, 'priority': 'medium', 'order': 9},
                {'title': 'User testing and feedback', 'hours': 4, 'priority': 'medium', 'order': 10},
                {'title': 'Bug fixes and optimization', 'hours': 6, 'priority': 'medium', 'order': 11},
                {'title': 'Documentation', 'hours': 4, 'priority': 'low', 'order': 12},
                {'title': 'Deployment and launch', 'hours': 3, 'priority': 'high', 'order': 13},
            ]
        },
        'presentation': {
            'patterns': ['presentation', 'slide deck', 'powerpoint', 'slides', 'pitch', 'demo'],
            'tasks': [
                {'title': 'Research and gather content', 'hours': 4, 'priority': 'high', 'order': 1},
                {'title': 'Create presentation outline', 'hours': 2, 'priority': 'high', 'order': 2},
                {'title': 'Design slide templates', 'hours': 2, 'priority': 'medium', 'order': 3},
                {'title': 'Create title and intro slides', 'hours': 1, 'priority': 'medium', 'order': 4},
                {'title': 'Build main content slides', 'hours': 6, 'priority': 'high', 'order': 5},
                {'title': 'Add visuals and graphics', 'hours': 4, 'priority': 'medium', 'order': 6},
                {'title': 'Create conclusion slide', 'hours': 1, 'priority': 'medium', 'order': 7},
                {'title': 'Write speaker notes', 'hours': 2, 'priority': 'low', 'order': 8},
                {'title': 'Practice and rehearse', 'hours': 3, 'priority': 'high', 'order': 9},
                {'title': 'Get feedback and revise', 'hours': 2, 'priority': 'medium', 'order': 10},
                {'title': 'Final run-through', 'hours': 1, 'priority': 'high', 'order': 11},
            ]
        },
        'group_project': {
            'patterns': ['group project', 'team project', 'collaboration', 'group work'],
            'tasks': [
                {'title': 'Team kickoff meeting', 'hours': 1, 'priority': 'high', 'order': 1},
                {'title': 'Define roles and responsibilities', 'hours': 2, 'priority': 'high', 'order': 2},
                {'title': 'Create project timeline', 'hours': 2, 'priority': 'high', 'order': 3},
                {'title': 'Research and planning', 'hours': 6, 'priority': 'high', 'order': 4},
                {'title': 'Individual work assignments', 'hours': 12, 'priority': 'high', 'order': 5},
                {'title': 'Mid-project check-in meeting', 'hours': 1, 'priority': 'medium', 'order': 6},
                {'title': 'Integrate team contributions', 'hours': 4, 'priority': 'high', 'order': 7},
                {'title': 'Review and quality check', 'hours': 3, 'priority': 'medium', 'order': 8},
                {'title': 'Prepare final presentation', 'hours': 4, 'priority': 'high', 'order': 9},
                {'title': 'Final team review', 'hours': 2, 'priority': 'high', 'order': 10},
            ]
        },
        'lab_experiment': {
            'patterns': ['lab', 'experiment', 'laboratory', 'practical', 'lab report'],
            'tasks': [
                {'title': 'Read lab manual and instructions', 'hours': 1, 'priority': 'high', 'order': 1},
                {'title': 'Prepare materials and equipment', 'hours': 2, 'priority': 'high', 'order': 2},
                {'title': 'Conduct experiment and collect data', 'hours': 4, 'priority': 'high', 'order': 3},
                {'title': 'Analyze results and calculations', 'hours': 3, 'priority': 'high', 'order': 4},
                {'title': 'Create graphs and visualizations', 'hours': 2, 'priority': 'medium', 'order': 5},
                {'title': 'Write methods section', 'hours': 2, 'priority': 'medium', 'order': 6},
                {'title': 'Write results section', 'hours': 2, 'priority': 'medium', 'order': 7},
                {'title': 'Write discussion and conclusion', 'hours': 3, 'priority': 'medium', 'order': 8},
                {'title': 'Format lab report', 'hours': 1, 'priority': 'low', 'order': 9},
                {'title': 'Proofread and submit', 'hours': 1, 'priority': 'high', 'order': 10},
            ]
        },
        'study_guide': {
            'patterns': ['exam', 'test', 'midterm', 'final', 'quiz', 'study', 'review'],
            'tasks': [
                {'title': 'Organize notes and materials', 'hours': 2, 'priority': 'high', 'order': 1},
                {'title': 'Create study schedule', 'hours': 1, 'priority': 'high', 'order': 2},
                {'title': 'Review lecture notes', 'hours': 6, 'priority': 'high', 'order': 3},
                {'title': 'Review textbook chapters', 'hours': 8, 'priority': 'high', 'order': 4},
                {'title': 'Create summary sheets/flashcards', 'hours': 4, 'priority': 'medium', 'order': 5},
                {'title': 'Practice problems and exercises', 'hours': 6, 'priority': 'high', 'order': 6},
                {'title': 'Review past exams/quizzes', 'hours': 3, 'priority': 'high', 'order': 7},
                {'title': 'Join study group session', 'hours': 2, 'priority': 'medium', 'order': 8},
                {'title': 'Review difficult concepts', 'hours': 4, 'priority': 'high', 'order': 9},
                {'title': 'Final review day before exam', 'hours': 3, 'priority': 'high', 'order': 10},
            ]
        },
        'video_project': {
            'patterns': ['video', 'film', 'documentary', 'movie', 'recording', 'vlog'],
            'tasks': [
                {'title': 'Concept and script development', 'hours': 4, 'priority': 'high', 'order': 1},
                {'title': 'Storyboarding', 'hours': 3, 'priority': 'medium', 'order': 2},
                {'title': 'Location scouting', 'hours': 2, 'priority': 'medium', 'order': 3},
                {'title': 'Equipment setup and testing', 'hours': 2, 'priority': 'high', 'order': 4},
                {'title': 'Filming/recording footage', 'hours': 8, 'priority': 'high', 'order': 5},
                {'title': 'Organize and review footage', 'hours': 2, 'priority': 'medium', 'order': 6},
                {'title': 'Video editing', 'hours': 10, 'priority': 'high', 'order': 7},
                {'title': 'Add music and sound effects', 'hours': 3, 'priority': 'medium', 'order': 8},
                {'title': 'Color correction and effects', 'hours': 4, 'priority': 'medium', 'order': 9},
                {'title': 'Review and revisions', 'hours': 3, 'priority': 'medium', 'order': 10},
                {'title': 'Export final version', 'hours': 1, 'priority': 'high', 'order': 11},
            ]
        },
    }
    
    @classmethod
    def detect_project_type(cls, title, description=''):
        """Detect project type based on title and description"""
        search_text = f"{title} {description}".lower()
        
        for project_type, template in cls.PROJECT_TEMPLATES.items():
            for pattern in template['patterns']:
                if pattern in search_text:
                    return project_type
        
        return None
    
    @classmethod
    def generate_tasks(cls, project_title, project_description, deadline, auto_create=False):
        """
        Generate task suggestions based on project type
        
        Args:
            project_title: Title of the project
            project_description: Description of the project
            deadline: Project deadline datetime
            auto_create: If True, return tasks ready for DB insertion
        
        Returns:
            List of task dictionaries with suggested tasks
        """
        project_type = cls.detect_project_type(project_title, project_description)
        
        if not project_type:
            # Generic fallback tasks
            return cls._generate_generic_tasks(project_title, deadline, auto_create)
        
        template = cls.PROJECT_TEMPLATES[project_type]
        tasks = template['tasks']
        
        # Calculate task scheduling
        total_hours = sum(task['hours'] for task in tasks)
        days_available = (deadline - datetime.utcnow()).days
        
        # Add buffer time (20% extra)
        total_hours_with_buffer = total_hours * 1.2
        
        generated_tasks = []
        current_date = datetime.utcnow()
        
        for task_template in tasks:
            # Calculate when this task should be due
            task_ratio = task_template['order'] / len(tasks)
            days_offset = int(days_available * task_ratio)
            task_due_date = current_date + timedelta(days=days_offset)
            
            # Don't set due date past project deadline
            if task_due_date > deadline:
                task_due_date = deadline - timedelta(hours=task_template['hours'])
            
            task_data = {
                'title': task_template['title'],
                'description': f"Auto-generated for {project_type.replace('_', ' ')} project",
                'estimated_hours': task_template['hours'],
                'priority': task_template['priority'],
                'due_date': task_due_date.isoformat() if auto_create else task_due_date,
                'status': 'todo',
                'order': task_template['order']
            }
            
            generated_tasks.append(task_data)
        
        return {
            'project_type': project_type,
            'detected': True,
            'total_estimated_hours': total_hours,
            'total_with_buffer': total_hours_with_buffer,
            'tasks': generated_tasks,
            'warnings': cls._generate_warnings(days_available, total_hours_with_buffer)
        }
    
    @classmethod
    def _generate_generic_tasks(cls, project_title, deadline, auto_create=False):
        """Generate generic tasks when no specific template matches"""
        days_available = (deadline - datetime.utcnow()).days
        
        generic_tasks = [
            {'title': 'Project planning and research', 'hours': 4, 'priority': 'high', 'order': 1},
            {'title': 'Initial work and setup', 'hours': 6, 'priority': 'high', 'order': 2},
            {'title': 'Main work phase', 'hours': 12, 'priority': 'high', 'order': 3},
            {'title': 'Review and revisions', 'hours': 4, 'priority': 'medium', 'order': 4},
            {'title': 'Final touches and submission', 'hours': 2, 'priority': 'high', 'order': 5},
        ]
        
        generated_tasks = []
        current_date = datetime.utcnow()
        
        for task_template in generic_tasks:
            task_ratio = task_template['order'] / len(generic_tasks)
            days_offset = int(days_available * task_ratio)
            task_due_date = current_date + timedelta(days=days_offset)
            
            if task_due_date > deadline:
                task_due_date = deadline - timedelta(hours=task_template['hours'])
            
            task_data = {
                'title': task_template['title'],
                'description': f"Suggested task for: {project_title}",
                'estimated_hours': task_template['hours'],
                'priority': task_template['priority'],
                'due_date': task_due_date.isoformat() if auto_create else task_due_date,
                'status': 'todo',
                'order': task_template['order']
            }
            
            generated_tasks.append(task_data)
        
        return {
            'project_type': 'generic',
            'detected': False,
            'total_estimated_hours': 28,
            'total_with_buffer': 33.6,
            'tasks': generated_tasks,
            'warnings': cls._generate_warnings(days_available, 33.6)
        }
    
    @classmethod
    def _generate_warnings(cls, days_available, total_hours_needed):
        """Generate warnings about project timeline"""
        warnings = []
        
        # Assume 4 productive hours per day
        hours_available = days_available * 4
        
        if total_hours_needed > hours_available:
            warnings.append(
                f"⚠️ Warning: This project needs {total_hours_needed:.0f} hours, but you only have "
                f"{days_available} days ({hours_available:.0f} productive hours). Consider starting immediately!"
            )
        elif total_hours_needed > (hours_available * 0.7):
            warnings.append(
                f"⚡ Note: Timeline is tight. You'll need to dedicate {total_hours_needed / days_available:.1f} hours per day."
            )
        
        if days_available < 3:
            warnings.append("🚨 Very tight deadline! Prioritize high-priority tasks first.")
        
        return warnings
