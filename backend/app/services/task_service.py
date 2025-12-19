from app.models import Task, Project, ProjectMember, User
from app import db

class TaskService:
    @staticmethod
    def create_task(data, project_id, user_id):
        """Create a new task"""
        # Check project access
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'code': 'FORBIDDEN', 'message': 'Access denied'}
        
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
            return None, {'message': str(e)}
    
    @staticmethod
    def get_project_tasks(project_id, user_id):
        """Get all tasks for a project"""
        # Check project access
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'code': 'FORBIDDEN', 'message': 'Access denied'}
        
        tasks = Task.query.filter_by(project_id=project_id).all()
        return tasks, None
    
    @staticmethod
    def get_my_tasks(user_id):
        """Get all tasks assigned to user"""
        # Get all projects user is a member of
        project_ids = db.session.query(ProjectMember.project_id).filter_by(user_id=user_id).all()
        project_ids = [p[0] for p in project_ids]
        
        # Get tasks from those projects
        tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()
        return tasks, None
    
    @staticmethod
    def update_task(task_id, data, user_id):
        """Update a task"""
        task = Task.query.get(task_id)
        
        if not task:
            return None, {'code': 'NOT_FOUND', 'message': 'Task not found'}
        
        # Check project access
        member = ProjectMember.query.filter_by(
            project_id=task.project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'code': 'FORBIDDEN', 'message': 'Access denied'}
        
        try:
            for key, value in data.items():
                setattr(task, key, value)
            
            db.session.commit()
            return task, None
        except Exception as e:
            db.session.rollback()
            return None, {'message': str(e)}
    
    @staticmethod
    def delete_task(task_id, user_id):
        """Delete a task"""
        task = Task.query.get(task_id)
        
        if not task:
            return False, {'code': 'NOT_FOUND', 'message': 'Task not found'}
        
        # Check project access
        member = ProjectMember.query.filter_by(
            project_id=task.project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return False, {'code': 'FORBIDDEN', 'message': 'Access denied'}
        
        try:
            db.session.delete(task)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, {'message': str(e)}
