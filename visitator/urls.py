from django.urls import path
from . import views


urlpatterns = [
    path('', views.home, name='home'),
    path('home', views.home, name='home'),
    path('explore', views.explore, name='explore'),
    path('course/<int:course_id>/', views.course_detail, name='course_detail'),
    path('filter_courses/', views.filter_courses, name='filter_courses'),
    path('enroll_course/<int:course_id>/', views.enroll_course, name='enroll_course'),
    path('solve_exercises/', views.solve_exercises, name='solve_exercises'),
    
    path('get_random_exercise/', views.get_random_exercise, name="get_random_exercise"),
    path('verify_solution/', views.verify_solution, name="verify_solution"),
    
    path('solve_questions/', views.solve_questions, name='solve_questions'),
    path('get_random_question/', views.get_random_question, name='get_random_question'),
    
    path('about_us/', views.about_us, name='about_us'),
    
    path('donate/', views.donate_view, name='donate'),
    path('make_donation', views.create_checkout_session, name='make_donation'),
    path('donation_thank_you/', views.donation_thank_you, name='donation_thank_you'),

    
]
