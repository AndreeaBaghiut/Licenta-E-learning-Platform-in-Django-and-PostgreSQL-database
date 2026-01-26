from django.urls import path
from . import views
from user import views as user_views

urlpatterns = [
    path('teacher/course/<int:course_id>/', views.teacher_course, name='teacher_course'),

    path('teacher/add_course/', views.add_course, name='add_course'),

    path('get_categories/', views.get_categories, name='get_categories'),

    path('update_course/<int:course_id>/', views.update_course, name='edit_course'),

    path('delete_course/<int:course_id>/', views.delete_course, name='delete_course'),

    
    path('edit_course/<int:course_id>/add_chapter/', views.add_chapter, name='add_chapter'),
    

    path('delete_chapter/<int:chapter_id>/', views.delete_chapter, name='delete_chapter'),

    path('update_chapter/<int:chapter_id>/', views.update_chapter, name='update_chapter'),

    path('chapter/<int:chapter_id>/add_subchapter/', views.add_subchapter, name='add_subchapter'),
    
    

    path('chapter/delete_subchapter/<int:subchapter_id>/', views.delete_subchapter,
         name='delete_subchapter'),

    path('chapter/update_subchapter/<int:subchapter_id>/', views.update_subchapter_title,
          name='update_subchapter_title'),

    path('chapter/subchapter/<int:subchapter_id>/', views.get_subchapter_content, name='get_subchapter_content'),

    path('chapter/subchapter/save_subchapter/', views.save_subchapter_content, name='save_subchapter'),
    
    
    
    path('course/publish_course/', views.publish_course, name='publish_course'), 

    path('edit_course/<int:course_id>/', views.edit_course, name='edit_course'),
    
    

    path('subchapter/<int:subchapter_id>/add_quiz/', views.add_quiz,
         name='add_quiz'),

    path('quiz/<int:quiz_id>/save_quiz/', views.save_quiz_content, name='save_quiz_content'),

    path('quiz/<int:quiz_id>/content/', views.get_quiz_content, name='get_quiz_content'),

    path('quiz/<int:quiz_id>/delete/', views.delete_quiz, name='delete_quiz'),

    path('quiz/answer/<int:answer_id>/delete/', views.delete_answer, name='delete_answer'),
    
    

    path('upload_video/', views.upload_video, name='upload_video'),

    path('upload_image/', views.upload_image, name='upload_image'),
    
    

    path('teacher_profile/', views.teacher_profile, name='teacher_profile'),

    path('', views.teacher_dashboard, name='teacher_dashboard'),

    path('teacher_courses', views.teacher_courses, name='teacher_courses'),

    path('change_password/', user_views.change_password, name='teacher_change_password'),
    path('forgot_password/', user_views.forgot_password, name='teacher_forgot_password'),
    path('reset/<uidb64>/<token>/', user_views.reset_password, name='teacher_reset_password'),
    path('delete_account/', user_views.delete_account, name='teacher_delete_account'),
    path('change_profile_photo/', user_views.change_profile_photo, name='teacher_change_profile_photo'),
    
    # ----Exercises----#
    path('exercises/', views.exercises_view, name='teacher_exercises'),
    path('add_exercise/', views.add_independent_exercise, name='add_independent_exercise'),
    path('run_tests/', views.run_tests, name='run_tests'),
    path('save_exercise/', views.save_exercise, name='save_exercise'),
    path('edit_exercise/<int:id>', views.edit_exercise, name='edit_exercise'),
    path('delete_exercise/<int:id>', views.delete_exercise, name='delete_exercise'),
    path('exercise/publish_exercise/', views.publish_exercise, name='publish_exercise'),
    
    # ----- Intrebari ----#
    path('questions/', views.questions_view, name='interview_questions'),
    path('add_question/', views.add_question, name='add_question'),
    path('edit_question/<int:id>/', views.edit_question, name='edit_question'),
    path('delete_question/<int:id>/', views.delete_question, name='delete_question'),
    path('question/publish_question/', views.publish_question, name='publish_question'),
    
    # ------ Statistici ----- #
    path('statistics/', views.statistics_view, name='statistics'),
    path('process-certificate/<int:certificate_id>/', views.process_certificate, name='process_certificate'),
    path('verify/<uuid:uuid>/', views.verify_certificate, name='verify_certificate'),


    
    


]
