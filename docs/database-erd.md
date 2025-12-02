# Database ERD

## Tables
1. users - User accounts
2. projects - Student projects
3. project_members - Links users to projects
4. tasks - Tasks within projects
5. calendar_blocks - User busy times
6. activities - Activity feed
7. files - Google Drive links
8. notifications - User notifications
9. comments - Task/project comments

## Key Relationships
- Users ↔ Projects (many-to-many)
- Projects → Tasks (one-to-many)
- Users → Tasks (assignment)
- Tasks → Tasks (dependencies)
