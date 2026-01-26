from django import template
from user.models import Student, Teacher

register = template.Library()


@register.filter
def is_instance_of(user, class_name):
    if class_name == "Student" and hasattr(user, 'student'):
        return isinstance(user.student, Student)
    elif class_name == "Teacher" and hasattr(user, 'teacher'):
        return isinstance(user.teacher, Teacher)
    return False


@register.filter(name='replace')
def replace(value, arg):
    return value.replace(arg, ' ')
