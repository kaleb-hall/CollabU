"""Suggested tasks for common student project types.

Picks a template (chosen by the user, or matched from keywords in the title and
description) and spreads its tasks evenly between now and the deadline.
"""
import re
from datetime import timedelta

from app.utils.time import iso_utc, utcnow

PRODUCTIVE_HOURS_PER_DAY = 4
BUFFER = 1.2

TEMPLATES = {
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
    'generic': {
        'patterns': [],
        'tasks': [
            {'title': 'Project planning and research', 'hours': 4, 'priority': 'high', 'order': 1},
            {'title': 'Initial work and setup', 'hours': 6, 'priority': 'high', 'order': 2},
            {'title': 'Main work phase', 'hours': 12, 'priority': 'high', 'order': 3},
            {'title': 'Review and revisions', 'hours': 4, 'priority': 'medium', 'order': 4},
            {'title': 'Final touches and submission', 'hours': 2, 'priority': 'high', 'order': 5},
        ]
    },
}


def detect_template(title, description=''):
    """The template whose matching keyword is longest, so "lab report" beats "report"."""
    text = f'{title} {description}'.lower()
    best_name, best_length = 'generic', 0
    for name, template in TEMPLATES.items():
        for pattern in template['patterns']:
            if len(pattern) > best_length and re.search(rf'\b{re.escape(pattern)}\b', text):
                best_name, best_length = name, len(pattern)
    return best_name


def suggest_tasks(title, description, deadline, template=None):
    name = template if template in TEMPLATES else detect_template(title, description)
    tasks = TEMPLATES[name]['tasks']
    now = utcnow()
    span = max(deadline - now, timedelta(0))

    suggestions = []
    for task in tasks:
        due = now + span * (task['order'] / len(tasks))
        suggestions.append({
            'title': task['title'],
            'description': f"Suggested for a {name.replace('_', ' ').removesuffix(' project')} project",
            'estimated_hours': task['hours'],
            'priority': task['priority'],
            'due_date': min(due, deadline),
        })

    total_hours = sum(task['hours'] for task in tasks)
    return {
        'project_type': name,
        'detected': name != 'generic',
        'total_estimated_hours': total_hours,
        'tasks': suggestions,
        'warnings': timeline_warnings((deadline - now).days, total_hours * BUFFER),
    }


def serialize(suggestions):
    return {**suggestions, 'tasks': [{**t, 'due_date': iso_utc(t['due_date'])} for t in suggestions['tasks']]}


def timeline_warnings(days_available, hours_needed):
    warnings = []
    hours_available = days_available * PRODUCTIVE_HOURS_PER_DAY
    if hours_needed > hours_available:
        warnings.append(
            f'This project needs about {hours_needed:.0f} hours but there are only {days_available} days '
            f'(about {hours_available:.0f} productive hours). Start as soon as you can.'
        )
    elif days_available and hours_needed > hours_available * 0.7:
        warnings.append(f'The timeline is tight: plan on about {hours_needed / days_available:.1f} hours a day.')
    if days_available < 3:
        warnings.append('Very tight deadline. Do the high priority tasks first.')
    return warnings
