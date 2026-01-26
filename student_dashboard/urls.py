from django.urls import path
from . import views
from user import views as user_views
from visitator import views as visitator_views
    
urlpatterns = [

    path('', views.student_dashboard, name='student_dashboard'),
    path('student_profile/', views.student_profile, name='student_profile'),
    path('change_password/', user_views.change_password, name='student_change_password'),
    path('forgot_password/', user_views.forgot_password, name='student_forgot_password'),
    path('reset/<uidb64>/<token>/', user_views.reset_password, name='student_reset_password'),
    path('delete_account/', user_views.delete_account, name='student_delete_account'),
    path('change_profile_photo/', user_views.change_profile_photo, name='student_change_profile_photo'),
    
    path('solve_exercises', visitator_views.solve_exercises, name='solve_exercises'),

    path('course/<int:course_id>/', views.course_details, name='student_dashboard_course'),
    path('submit_quiz/<int:quiz_id>/', views.submit_quiz, name='submit_quiz'),
    
    path('mark-next/', views.mark_next, name='mark_next'),
    
    path('request_certificate/<int:enrollment_id>/', views.request_certificate, name='request_certificate'),
]
