from app.models import Project, ProjectMember, Task, User
from app.services.ai_task_generator import AITaskGenerator
from app import db
from datetime import datetime

class ProjectService:
    @staticmethod
    def create_project(data, user_id, auto_generate_tasks=False):
        """Create a new project with optional AI task generation"""
        try:
            project = Project(
                title=data['title'],
                description=data.get('description'),
                deadline=data['deadline'],
                created_by=user_id
            )
            
            db.session.add(project)
            db.session.flush()
            
            # Add creator as admin
            creator_member = ProjectMember(
                project_id=project.id,
                user_id=user_id,
                role='admin'
            )
            db.session.add(creator_member)
            
            # AI Task Generation
            suggested_tasks = None
            if auto_generate_tasks:
                task_data = AITaskGenerator.generate_tasks(
                    project.title,
                    project.description or '',
                    project.deadline,
                    auto_create=True
                )
                
                # Create the suggested tasks
                for task_info in task_data['tasks']:
                    task = Task(
                        project_id=project.id,
                        title=task_info['title'],
                        description=task_info['description'],
                        due_date=datetime.fromisoformat(task_info['due_date'].replace('Z', '')),
                        estimated_hours=task_info['estimated_hours'],
                        priority=task_info['priority'],
                        status='todo'
                    )
                    db.session.add(task)
                
                suggested_tasks = task_data
            
            db.session.commit()
            
            return project, suggested_tasks, None
        except Exception as e:
            db.session.rollback()
            return None, None, {'message': str(e)}
    
    @staticmethod
    def get_task_suggestions(project_id, user_id):
        """Get AI task suggestions for an existing project"""
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'code': 'NOT_FOUND', 'message': 'Project not found'}
        
        # Check if user has access
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'code': 'FORBIDDEN', 'message': 'Access denied'}
        
        # Generate suggestions
        suggestions = AITaskGenerator.generate_tasks(
            project.title,
            project.description or '',
            project.deadline,
            auto_create=False
        )
        
        return suggestions, None
    
    @staticmethod
    def get_user_projects(user_id):
        """Get all projects for a user"""
        return Project.query.join(ProjectMember).filter(
            ProjectMember.user_id == user_id
        ).all()
    
    @staticmethod
    def get_project_by_id(project_id, user_id):
        """Get a specific project"""
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'code': 'NOT_FOUND', 'message': 'Project not found'}
        
        # Check if user has access
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member:
            return None, {'code': 'FORBIDDEN', 'message': 'Access denied'}
        
        return project, None
    
    @staticmethod
    def update_project(project_id, data, user_id):
        """Update a project"""
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'code': 'NOT_FOUND', 'message': 'Project not found'}
        
        # Check if user is admin
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id,
            role='admin'
        ).first()
        
        if not member:
            return None, {'code': 'FORBIDDEN', 'message': 'Only admins can update projects'}
        
        try:
            for key, value in data.items():
                setattr(project, key, value)
            
            db.session.commit()
            return project, None
        except Exception as e:
            db.session.rollback()
            return None, {'message': str(e)}
    
    @staticmethod
    def delete_project(project_id, user_id):
        """Delete a project"""
        project = Project.query.get(project_id)
        
        if not project:
            return False, {'code': 'NOT_FOUND', 'message': 'Project not found'}
        
        # Check if user is admin
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id,
            role='admin'
        ).first()
        
        if not member:
            return False, {'code': 'FORBIDDEN', 'message': 'Only admins can delete projects'}
        
        try:
            db.session.delete(project)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, {'message': str(e)}
    
    @staticmethod
    def add_member(project_id, current_user_id, new_user_id, role='member'):
        """Add a member to a project"""
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'code': 'NOT_FOUND', 'message': 'Project not found'}
        
        # Check if current user is admin
        admin = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=current_user_id,
            role='admin'
        ).first()
        
        if not admin:
            return None, {'code': 'FORBIDDEN', 'message': 'Only admins can add members'}
        
        # Check if user exists
        user = User.query.get(new_user_id)
        if not user:
            return None, {'code': 'USER_NOT_FOUND', 'message': 'User not found'}
        
        # Check if already a member
        existing = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=new_user_id
        ).first()
        
        if existing:
            return None, {'code': 'ALREADY_MEMBER', 'message': 'User is already a member'}
        
        try:
            member = ProjectMember(
                project_id=project_id,
                user_id=new_user_id,
                role=role
            )
            db.session.add(member)
            db.session.commit()
            return member, None
        except Exception as e:
            db.session.rollback()
            return None, {'message': str(e)}
    
    @staticmethod
    def remove_member(project_id, current_user_id, member_id):
        """Remove a member from a project"""
        project = Project.query.get(project_id)
        
        if not project:
            return False, {'code': 'NOT_FOUND', 'message': 'Project not found'}
        
        # Check if current user is admin
        admin = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=current_user_id,
            role='admin'
        ).first()
        
        if not admin:
            return False, {'code': 'FORBIDDEN', 'message': 'Only admins can remove members'}
        
        member = ProjectMember.query.get(member_id)
        if not member or member.project_id != project_id:
            return False, {'code': 'NOT_FOUND', 'message': 'Member not found'}
        
        try:
            db.session.delete(member)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, {'message': str(e)}
