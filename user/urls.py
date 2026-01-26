from django.urls import path
import visitator
from . import views
from django.contrib.auth import views as auth_views
from visitator.views import home
from teacher_dashboard.views import teacher_dashboard
from student_dashboard.views import student_dashboard

from .views import activate, student_registration, teacher_registration, student_login, teacher_login, student_teacher_logout, login_role, register_role, forgot_password, reset_password, terms

urlpatterns = [
    path('activate/<uidb64>/<token>', activate, name='activate'),
    path('student_login/', student_login, name='student_login'),
    path('teacher_login/', teacher_login, name='teacher_login'),
    path('home/', home, name='home'),
    path('student_registration/', student_registration, name='student_registration'),
    path('teacher_registration/', teacher_registration, name='teacher_registration'),
    path('login/role/', login_role, name='login_role'),
    path('register/role/', register_role, name='register_role'),
    path('student_logout/', student_teacher_logout, name='student_logout'),
    path('teacher_logout/', student_teacher_logout, name='teacher_logout'),
    path('teacher_dashboard/', teacher_dashboard, name='teacher_dashboard'),
    path('student_dashboard/', student_dashboard, name='student_dashboard'),
    path('forgot_password/', forgot_password, name='forgot_password'),
    path('reset_password/', reset_password, name='reset_password'),
    path('terms/', terms, name='terms'),



]