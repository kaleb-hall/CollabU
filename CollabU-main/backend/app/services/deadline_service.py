from app import db
from app.models.task import Task
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.calendar_block import CalendarBlock
from app.models.user import User
from datetime import datetime, timedelta
from collections import defaultdict
import pytz

class DeadlineService:
    
    # Constants
    WORK_HOURS_PER_DAY = 8  # Maximum work hours per day
    WORK_START_HOUR = 9     # 9 AM
    WORK_END_HOUR = 17      # 5 PM
    
    @staticmethod
    def calculate_task_schedule(project_id):
        """
        Main algorithm: Calculate optimal schedule for all project tasks
        Returns: (schedule, warnings, error)
        
        schedule = {
            'tasks': [list of tasks with updated dates],
            'team_workload': {user_id: hours_assigned},
            'total_hours_needed': float,
            'total_hours_available': float,
            'is_achievable': bool
        }
        """
        project = Project.query.get(project_id)
        if not project:
            return None, None, {'message': 'Project not found', 'code': 'NOT_FOUND'}
        
        # Get all tasks
        tasks = Task.query.filter_by(project_id=project_id).all()
        
        if not tasks:
            return None, ['No tasks in project'], None
        
        # Get team members
        members = ProjectMember.query.filter_by(project_id=project_id).all()
        team_users = [User.query.get(m.user_id) for m in members]
        
        if not team_users:
            return None, ['No team members in project'], None
        
        # Calculate available hours for each team member
        today = datetime.utcnow()
        available_hours = DeadlineService._calculate_available_hours(
            team_users, 
            today, 
            project.deadline
        )
        
        # Sort tasks by priority and dependencies
        sorted_tasks = DeadlineService._sort_tasks_by_priority(tasks)
        
        # Assign tasks to team members and calculate dates
        schedule = DeadlineService._assign_and_schedule_tasks(
            sorted_tasks,
            team_users,
            available_hours,
            today,
            project.deadline
        )
        
        # Generate warnings
        warnings = DeadlineService._generate_warnings(schedule, project.deadline)
        
        return schedule, warnings, None
    
    @staticmethod
    def _calculate_available_hours(users, start_date, end_date):
        """
        Calculate available hours for each user between start and end date
        Returns: {user_id: available_hours}
        """
        available_hours = {}
        
        for user in users:
            # Get calendar blocks for this user
            blocks = CalendarBlock.query.filter(
                CalendarBlock.user_id == user.id,
                CalendarBlock.start_time >= start_date,
                CalendarBlock.end_time <= end_date
            ).all()
            
            # Calculate total days
            total_days = (end_date - start_date).days
            
            # Start with maximum possible hours
            max_hours = total_days * DeadlineService.WORK_HOURS_PER_DAY
            
            # Subtract blocked hours
            blocked_hours = 0
            for block in blocks:
                duration = (block.end_time - block.start_time).total_seconds() / 3600
                blocked_hours += duration
            
            available_hours[user.id] = max(0, max_hours - blocked_hours)
        
        return available_hours
    
    @staticmethod
    def _sort_tasks_by_priority(tasks):
        """
        Sort tasks by priority (urgent > high > medium > low)
        """
        priority_order = {'urgent': 0, 'high': 1, 'medium': 2, 'low': 3}
        
        return sorted(
            tasks, 
            key=lambda t: (
                priority_order.get(t.priority, 4),
                t.due_date if t.due_date else datetime.max
            )
        )
    
    @staticmethod
    def _assign_and_schedule_tasks(tasks, team_users, available_hours, start_date, project_deadline):
        """
        Assign tasks to users and calculate optimal start/due dates
        """
        # Track hours assigned to each user
        assigned_hours = {user.id: 0 for user in team_users}
        
        # Total hours needed
        total_hours_needed = sum(t.estimated_hours or 4 for t in tasks)
        total_hours_available = sum(available_hours.values())
        
        scheduled_tasks = []
        current_date = start_date
        
        for task in tasks:
            # Estimate hours if not provided
            task_hours = task.estimated_hours or 4.0
            
            # Find team member with most available hours
            best_user = min(
                team_users,
                key=lambda u: assigned_hours[u.id]
            )
            
            # Assign task
            task.assigned_to = best_user.id
            assigned_hours[best_user.id] += task_hours
            
            # Calculate start and due dates
            # Start: either now or when previous task ends
            task_start = current_date
            
            # Due: start + estimated hours (spread across work days)
            days_needed = task_hours / DeadlineService.WORK_HOURS_PER_DAY
            task_due = task_start + timedelta(days=days_needed)
            
            # Make sure we don't exceed project deadline
            if task_due > project_deadline:
                task_due = project_deadline
            
            # Update task
            task.start_date = task_start
            task.due_date = task_due
            
            scheduled_tasks.append({
                'task_id': task.id,
                'title': task.title,
                'assigned_to': best_user.id,
                'assigned_to_name': f"{best_user.first_name} {best_user.last_name}",
                'start_date': task_start.isoformat(),
                'due_date': task_due.isoformat(),
                'estimated_hours': task_hours,
                'priority': task.priority
            })
            
            # Move current_date forward for next task
            current_date = task_due
        
        # Save all task updates
        db.session.commit()
        
        return {
            'tasks': scheduled_tasks,
            'team_workload': assigned_hours,
            'total_hours_needed': total_hours_needed,
            'total_hours_available': total_hours_available,
            'is_achievable': total_hours_needed <= total_hours_available
        }
    
    @staticmethod
    def _generate_warnings(schedule, project_deadline):
        """
        Generate warnings about the schedule
        """
        warnings = []
        
        # Check if achievable
        if not schedule['is_achievable']:
            shortage = schedule['total_hours_needed'] - schedule['total_hours_available']
            warnings.append(
                f"⚠️ WARNING: Project needs {schedule['total_hours_needed']:.1f} hours "
                f"but only {schedule['total_hours_available']:.1f} hours available. "
                f"You're short by {shortage:.1f} hours!"
            )
        
        # Check for unbalanced workload
        workloads = list(schedule['team_workload'].values())
        if workloads:
            max_load = max(workloads)
            min_load = min(workloads)
            if max_load > min_load * 2:  # If someone has 2x more work than others
                warnings.append(
                    f"⚠️ WARNING: Workload is unbalanced. "
                    f"Max: {max_load:.1f}h, Min: {min_load:.1f}h"
                )
        
        # Check if tasks extend beyond deadline
        for task_info in schedule['tasks']:
            task_due = datetime.fromisoformat(task_info['due_date'].replace('Z', '+00:00'))
            if task_due > project_deadline:
                warnings.append(
                    f"⚠️ WARNING: Task '{task_info['title']}' extends beyond project deadline"
                )
        
        return warnings
    
    @staticmethod
    def suggest_reallocation(project_id):
        """
        Suggest task reallocations to improve schedule
        """
        # This is a placeholder for future enhancement
        # Could implement smart suggestions like:
        # - "Move Task X from Alice to Bob to balance workload"
        # - "Task Y should start earlier to meet deadline"
        pass
