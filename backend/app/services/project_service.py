from app import db
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from datetime import datetime

class ProjectService:
    
    @staticmethod
    def create_project(data, user_id):
        """
        Create a new project
        Returns: (project, error)
        """
        try:
            project = Project(
                title=data['title'],
                description=data.get('description'),
                deadline=data['deadline'],
                created_by=user_id
            )
            
            db.session.add(project)
            
            # Add creator as admin member
            member = ProjectMember(
                project=project,
                user_id=user_id,
                role='admin'
            )
            db.session.add(member)
            
            db.session.commit()
            return project, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error creating project', 'details': str(e)}
    
    @staticmethod
    def get_user_projects(user_id):
        """Get all projects where user is a member"""
        # Get project IDs where user is a member
        member_project_ids = db.session.query(ProjectMember.project_id).filter_by(user_id=user_id).all()
        member_project_ids = [pid[0] for pid in member_project_ids]
        
        # Get those projects
        projects = Project.query.filter(Project.id.in_(member_project_ids)).all()
        return projects
    
    @staticmethod
    def get_project_by_id(project_id, user_id):
        """
        Get project by ID (only if user is a member)
        Returns: (project, error)
        """
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'message': 'Project not found', 'code': 'NOT_FOUND'}
        
        # Check if user is a member
        is_member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not is_member:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        return project, None
    
    @staticmethod
    def update_project(project_id, data, user_id):
        """
        Update a project (only owner or admin can update)
        Returns: (project, error)
        """
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'message': 'Project not found', 'code': 'NOT_FOUND'}
        
        # Check if user is owner or admin
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not member or (project.created_by != user_id and member.role != 'admin'):
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        try:
            # Update fields
            if 'title' in data:
                project.title = data['title']
            if 'description' in data:
                project.description = data['description']
            if 'deadline' in data:
                project.deadline = data['deadline']
            if 'status' in data:
                project.status = data['status']
            
            project.updated_at = datetime.utcnow()
            
            db.session.commit()
            return project, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error updating project', 'details': str(e)}
    
    @staticmethod
    def delete_project(project_id, user_id):
        """
        Delete a project (only owner can delete)
        Returns: (success, error)
        """
        project = Project.query.get(project_id)
        
        if not project:
            return False, {'message': 'Project not found', 'code': 'NOT_FOUND'}
        
        # Only owner can delete
        if project.created_by != user_id:
            return False, {'message': 'Only project owner can delete', 'code': 'FORBIDDEN'}
        
        try:
            db.session.delete(project)
            db.session.commit()
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {'message': 'Error deleting project', 'details': str(e)}
    
    @staticmethod
    def add_member(project_id, user_id, new_member_user_id, role='member'):
        """
        Add a member to a project (only admin can add)
        Returns: (member, error)
        """
        project = Project.query.get(project_id)
        
        if not project:
            return None, {'message': 'Project not found', 'code': 'NOT_FOUND'}
        
        # Check if requester is admin
        requester = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not requester or requester.role != 'admin':
            return None, {'message': 'Only admins can add members', 'code': 'FORBIDDEN'}
        
        # Check if new member exists
        new_user = User.query.get(new_member_user_id)
        if not new_user:
            return None, {'message': 'User not found', 'code': 'USER_NOT_FOUND'}
        
        # Check if already a member
        existing = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=new_member_user_id
        ).first()
        
        if existing:
            return None, {'message': 'User is already a member', 'code': 'ALREADY_MEMBER'}
        
        try:
            member = ProjectMember(
                project_id=project_id,
                user_id=new_member_user_id,
                role=role
            )
            db.session.add(member)
            db.session.commit()
            return member, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error adding member', 'details': str(e)}
    
    @staticmethod
    def remove_member(project_id, user_id, member_user_id):
        """
        Remove a member from a project (only admin can remove, can't remove owner)
        Returns: (success, error)
        """
        project = Project.query.get(project_id)
        
        if not project:
            return False, {'message': 'Project not found', 'code': 'NOT_FOUND'}
        
        # Can't remove project owner
        if project.created_by == member_user_id:
            return False, {'message': 'Cannot remove project owner', 'code': 'FORBIDDEN'}
        
        # Check if requester is admin
        requester = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).first()
        
        if not requester or requester.role != 'admin':
            return False, {'message': 'Only admins can remove members', 'code': 'FORBIDDEN'}
        
        # Find member to remove
        member = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=member_user_id
        ).first()
        
        if not member:
            return False, {'message': 'Member not found', 'code': 'NOT_FOUND'}
        
        try:
            db.session.delete(member)
            db.session.commit()
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {'message': 'Error removing member', 'details': str(e)}
