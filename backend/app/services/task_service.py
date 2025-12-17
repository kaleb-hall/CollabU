from app import db
from app.models.task import Task
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from datetime import datetime

class TaskService:
    
    @staticmethod
    def create_task(project_id, data, user_id):
        """
        Create a new task
        Returns: (task, error)
        """
        # Check if user is member of project
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        # Check if assigned user is a member
        if data.get('assigned_to'):
            assignee_member = ProjectMember.query.filter_by(
                project_id=project_id,
                user_id=data['assigned_to']
            ).first()
            
            if not assignee_member:
                return None, {'message': 'Assigned user is not a project member', 'code': 'INVALID_ASSIGNEE'}
        
        try:
            task = Task(
                project_id=project_id,
                title=data['title'],
                description=data.get('description'),
                due_date=data['due_date'],
                start_date=data.get('start_date'),
                estimated_hours=data.get('estimated_hours'),
                priority=data.get('priority', 'medium'),
                assigned_to=data.get('assigned_to')
            )
            
            db.session.add(task)
            db.session.commit()
            return task, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error creating task', 'details': str(e)}
    
    @staticmethod
    def get_project_tasks(project_id, user_id, filters=None):
        """
        Get all tasks for a project (with optional filters)
        Returns: list of tasks
        """
        # Check if user is member
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        query = Task.query.filter_by(project_id=project_id)
        
        # Apply filters
        if filters:
            if filters.get('status'):
                query = query.filter_by(status=filters['status'])
            if filters.get('assigned_to'):
                query = query.filter_by(assigned_to=filters['assigned_to'])
            if filters.get('priority'):
                query = query.filter_by(priority=filters['priority'])
        
        tasks = query.order_by(Task.due_date.asc()).all()
        return tasks, None
    
    @staticmethod
    def get_user_tasks(user_id, filters=None):
        """Get all tasks assigned to a user across all projects"""
        query = Task.query.filter_by(assigned_to=user_id)
        
        # Apply filters
        if filters:
            if filters.get('status'):
                query = query.filter_by(status=filters['status'])
            if filters.get('priority'):
                query = query.filter_by(priority=filters['priority'])
        
        tasks = query.order_by(Task.due_date.asc()).all()
        return tasks
    
    @staticmethod
    def get_task_by_id(task_id, user_id):
        """
        Get task by ID (only if user is project member)
        Returns: (task, error)
        """
        task = Task.query.get(task_id)
        
        if not task:
            return None, {'message': 'Task not found', 'code': 'NOT_FOUND'}
        
        # Check if user is project member
        member = ProjectMember.query.filter_by(
            project_id=task.project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        return task, None
    
    @staticmethod
    def update_task(task_id, data, user_id):
        """
        Update a task
        Returns: (task, error)
        """
        task = Task.query.get(task_id)
        
        if not task:
            return None, {'message': 'Task not found', 'code': 'NOT_FOUND'}
        
        # Check if user is project member
        member = ProjectMember.query.filter_by(
            project_id=task.project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        # Check if new assignee is a member
        if 'assigned_to' in data and data['assigned_to']:
            assignee_member = ProjectMember.query.filter_by(
                project_id=task.project_id,
                user_id=data['assigned_to']
            ).first()
            
            if not assignee_member:
                return None, {'message': 'Assigned user is not a project member', 'code': 'INVALID_ASSIGNEE'}
        
        try:
            # Update fields
            if 'title' in data:
                task.title = data['title']
            if 'description' in data:
                task.description = data['description']
            if 'due_date' in data:
                task.due_date = data['due_date']
            if 'start_date' in data:
                task.start_date = data['start_date']
            if 'estimated_hours' in data:
                task.estimated_hours = data['estimated_hours']
            if 'priority' in data:
                task.priority = data['priority']
            if 'status' in data:
                task.status = data['status']
                if data['status'] == 'completed':
                    task.completed_at = datetime.utcnow()
            if 'assigned_to' in data:
                task.assigned_to = data['assigned_to']
            
            task.updated_at = datetime.utcnow()
            
            db.session.commit()
            return task, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error updating task', 'details': str(e)}
    
    @staticmethod
    def delete_task(task_id, user_id):
        """
        Delete a task (only project admin/owner)
        Returns: (success, error)
        """
        task = Task.query.get(task_id)
        
        if not task:
            return False, {'message': 'Task not found', 'code': 'NOT_FOUND'}
        
        # Check if user is admin or owner
        member = ProjectMember.query.filter_by(
            project_id=task.project_id,
            user_id=user_id
        ).first()
        
        if not member or (member.role not in ['admin'] and task.project.created_by != user_id):
            return False, {'message': 'Only project admin/owner can delete tasks', 'code': 'FORBIDDEN'}
        
        try:
            db.session.delete(task)
            db.session.commit()
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {'message': 'Error deleting task', 'details': str(e)}
