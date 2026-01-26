# E-learning platform

A comprehensive Django-based Learning Management System designed to facilitate online education with role-based access for students, teachers, and administrators.

## Project Overview 

This is a full-featured LMS that enables teachers to create and manage courses, while students can enroll, track progress, complete quizzes, and earn certificates. The platform supports multiple course categories, progress tracking, and interactive learning resources.

### Key Features

- **User Management**
  - Role-based access control (Student, Teacher, Administrator)
  - Custom user authentication system
  - User profile management with resume uploads
  - Profile picture support

- **Course Management**
  - Create and publish courses with organized chapters
  - Hierarchical course structure (Courses → Chapters → Subchapters)
  - Course categorization (Languages, General)
  - Course status tracking (draft, published, finished)
  - Course image uploads

- **Learning Features**
  - Interactive quizzes with multiple-choice questions
  - Exercise support (programming exercises with test cases)
  - Progress tracking for students
  - Subchapter completion status
  - Video content support

- **Certification**
  - Automatic certificate generation upon course completion
  - Certificate approval workflow (pending, approved, rejected)
  - Unique certificate verification URLs
  - Certificate download functionality

- **Dashboard**
  - Student dashboard with enrollment and progress overview
  - Teacher dashboard for course and content management
  - Real-time progress tracking
  - Course performance analytics


**Note**: To add screenshots, create an `images/` folder in the project root and add your screenshots with the names referenced above. Update the image paths as needed.

## Tech Stack

- **Backend**: Django 5.0+
- **Database**: SQLite (default, configurable)
- **Frontend**: HTML5, CSS3, JavaScript
- **Key Dependencies**:
  - `django-crispy-forms` - Form rendering
  - `django-tinymce` - Rich text editor
  - `django-recaptcha` - CAPTCHA protection
  - `django-simple-captcha` - Alternative CAPTCHA option
  - `Pillow` - Image processing
  - `requests` - HTTP client library

## Project Structure

```
licenta/
├── Licenta/                   # Project settings and configuration
│   ├── settings.py            # Django settings
│   ├── urls.py                # URL routing
│   ├── wsgi.py                # WSGI application
│   └── asgi.py                # ASGI application
├── student_dashboard/         # Student-related functionality
│   ├── models.py              # Enrollment, Progress, Quiz Results, Certificates
│   ├── views.py               # Student dashboard views
│   └── templates/             # Student UI templates
├── teacher_dashboard/         # Teacher course management
│   ├── models.py              # Courses, Chapters, Quizzes, Exercises
│   ├── views.py               # Course management views
│   └── templates/             # Teacher UI templates
├── user/                      # User authentication and profiles
│   ├── models.py              # Custom User model (FrontUser)
│   ├── backends.py            # Authentication backends
│   ├── forms.py               # User registration/login forms
│   └── templates/             # User UI templates
├── visitator/                 # Public/visitor functionality
├── static/                    # Static files (CSS, JS, images)
├── media/                     # User-uploaded files
│   ├── certificate_templates/ # Certificate templates
│   ├── courses_images/        # Course images
│   ├── profile_pictures/      # User profile pictures
│   ├── resumes/               # Student resumes
│   ├── site_icons/            # Site icons
│   ├── subchapter_images/     # Learning content images
│   └── subchapters_video/     # Video content
├── templates/                 # Base templates
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
└── package.json               # Node.js dependencies
```

## Getting Started

### Prerequisites

- Python 3.8+
- pip 
- Virtual environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd licenta
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure the database**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser account**
   ```bash
   python manage.py createsuperuser
   ```

6. **Collect static files** (for production)
   ```bash
   python manage.py collectstatic
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

   The application will be available at `http://localhost:8000`

## Models Overview

### User Management
- **FrontUser** - Custom user model extending Django's User model

### Course Management
- **Course** - Main course entity with metadata and publication status
- **Category** - Course categorization (Languages, General)
- **Capitol** (Chapter) - Organized course sections
- **Subcapitol** (Subchapter) - Learning units within chapters

### Learning & Assessment
- **Quizz** - Quiz associated with subchapters
- **Question** - Quiz questions
- **Answer** - Multiple choice answers with correctness indicator
- **Exercise** - Programming exercises with test cases

### Student Progress
- **Enrollment** - Student-course relationship with progress tracking
- **ProgressTracker** - Tracks completion status of subchapters
- **QuizResult** - Stores student quiz attempt results
- **Certificate** - Issued upon course completion with approval workflow

## Authentication & Authorization

The project uses a custom user model (`FrontUser`) with role-based access control:

- **Student**: Can enroll in courses, attempt quizzes, track progress
- **Teacher**: Can create/manage courses, view student progress, approve certificates
- **Administrator**: Full system access via Django admin panel

## Main URLs

The application uses a modular URL structure:

- `/` - Homepage/Visitor views
- `/user/` - User authentication (login, registration, profile)
- `/dashboard/` - Student dashboard
- `/teacher/` - Teacher course management
- `/admin/` - Django admin panel

## Database Setup

Initial migrations are included. To run migrations:

```bash
# Create new migrations for model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

Existing migration files cover:
- Initial schema setup
- Quiz results and completion status
- Certificates and approval workflows
- Programming exercises and test cases

## Configuration

Key settings in [Licenta/settings.py](Licenta/settings.py):

- **Custom User Model**: `AUTH_USER_MODEL = 'user.FrontUser'`
- **Media Files**: Configured for course images, profile pictures, videos, certificates
- **ALLOWED_HOSTS**: Currently set to `['*', 'localhost', '127.0.0.1']` (update for production)
- **DEBUG**: Set to `True` for development (disable in production)
- **Security**: Uses Django's security middleware (update SECRET_KEY in production)

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Superuser
```bash
python manage.py createsuperuser
```

### Accessing Admin Panel
Navigate to `http://localhost:8000/admin/` and log in with your superuser credentials.

## Dependencies

See requirements.txt for complete list. Main packages:

- `django~=5.0.4` - Web framework
- `django-tinymce` - Rich text editing for course content
- `django-crispy-forms` - Advanced form rendering
- `django-recaptcha` - CAPTCHA validation
- `Pillow` - Image processing for uploads
- `requests` - HTTP library for external integrations

## License

This project is a bachelor's degree project (Licenta).

## Contributing

For development and bug fixes, please create a pull request with a clear description of changes.

## Support

For issues and questions, please open an issue in the repository.

## Deployment Considerations

Before deploying to production:

1. **Security**
   - Change `SECRET_KEY` in settings
   - Set `DEBUG = False`
   - Update `ALLOWED_HOSTS` with your domain
   - Use environment variables for sensitive configuration
   - Enable HTTPS

2. **Database**
   - Migrate from SQLite to PostgreSQL/MySQL
   - Set up database backups

3. **Static & Media Files**
   - Configure CDN or static file server
   - Set up media file storage

4. **Performance**
   - Enable caching
   - Set up task queue (Celery) for async operations
   - Configure CORS if needed

5. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure logging
   - Set up uptime monitoring

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django Best Practices](https://django.readthedocs.io/en/stable/internals/contributing/writing-code/coding-style.html)
- [TinyMCE Documentation](https://www.tiny.cloud/develop/tinymce/)

---

**Last Updated**: June 2025
