from django.urls import reverse


def user_profile_urls(request):
    if not request.user.is_authenticated:
        return {
            'forgot_password_url': reverse('forgot_password'),
        }

    if hasattr(request.user, 'teacher'):
        return {
            'change_password_url': reverse('teacher_change_password'),
            'forgot_password_url': reverse('teacher_forgot_password'),
            'delete_account_url': reverse('teacher_delete_account'),
            'change_profile_photo_url': reverse('teacher_change_profile_photo'),
        }
    elif hasattr(request.user, 'student'):
        return {
            'change_password_url': reverse('student_change_password'),
            'forgot_password_url': reverse('student_forgot_password'),
            'delete_account_url': reverse('student_delete_account'),
            'change_profile_photo_url': reverse('student_change_profile_photo'),
        }

    return {}
