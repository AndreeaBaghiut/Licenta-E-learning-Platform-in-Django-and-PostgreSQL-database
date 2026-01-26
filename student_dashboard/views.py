import json
from django.utils import timezone
from django.shortcuts import redirect
from student_dashboard.models import Enrollment, QuizResult, ProgressTracker, Certificate
from teacher_dashboard.models import Course, Subcapitol, Quizz, Answer
from user.models import Student
from django.http import JsonResponse
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Avg


def student_dashboard(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        student = Student.objects.get(id=request.user.id)
    except Student.DoesNotExist:
        return redirect('home')
    
    in_progress_enrollments = Enrollment.objects.filter(
        student=student, 
        status='in_progress'
    ).order_by('-enrolled_on')
    
    completed_enrollments = Enrollment.objects.filter(
        student=student, 
        status='completed'
    ).order_by('-enrolled_on')
    
    for enrollment in in_progress_enrollments:
        total_subchapters = Subcapitol.objects.filter(chapter__course=enrollment.course).count()
        
        if total_subchapters > 0:
            completed = ProgressTracker.objects.filter(
                enrollment=enrollment,
                is_completed=True
            ).count()
            
            percent_complete = round((completed / total_subchapters) * 100, 2)            
            enrollment.progress = percent_complete
            enrollment.save()
    
    for enrollment in in_progress_enrollments:
        latest_tracker = ProgressTracker.objects.filter(
        enrollment=enrollment,
        completion_date__isnull=False
    ).order_by('-completion_date').first()
    
        if not latest_tracker:
            latest_tracker = ProgressTracker.objects.filter(
            enrollment=enrollment,
            start_date__isnull=False
        ).order_by('-start_date').first()
    
        if latest_tracker:
            enrollment.last_accessed = latest_tracker.completion_date or latest_tracker.start_date
        else:
            enrollment.last_accessed = None
    
    for enrollment in completed_enrollments:
        if not enrollment.progress or enrollment.progress == 0:
            total_quiz_questions = QuizResult.objects.filter(
                progress__enrollment=enrollment,
                is_completed=True
            ).count()
            
            correct_answers = QuizResult.objects.filter(
                progress__enrollment=enrollment,
                is_completed=True,
                is_correct=True
            ).count()
            
            score_percentage = 0
            if total_quiz_questions > 0:
                score_percentage = (correct_answers / total_quiz_questions) * 100
            
            score_percentage = round(score_percentage, 2)
            
            enrollment.progress = score_percentage
            enrollment.save()
        
        enrollment.final_score = enrollment.progress
                
        try:
            certificate = Certificate.objects.get(enrollment=enrollment)
            enrollment.certificate_status = certificate.status
            enrollment.has_certificate = (certificate.status == 'approved')
        except Certificate.DoesNotExist:
            enrollment.certificate_status = None
            enrollment.has_certificate = False
    
    enrolled_course_ids = student.enrollments.all().values_list('course_id', flat=True)
    recommended_courses = Course.objects.filter(
        is_published=True,
        ).exclude(id__in=enrolled_course_ids)[:3]
    
    total_courses = student.enrollments.count() 
    completed_courses = completed_enrollments.count() 
    
    certificates_count = 0
    avg_score = 0
    
    if completed_courses > 0:
        certificates_count = Certificate.objects.filter(
        enrollment__in=completed_enrollments,
        status='approved'
        ).count()
        
        if completed_courses > 0:
            avg_score = completed_enrollments.aggregate(Avg('progress'))['progress__avg']
            if avg_score:
                avg_score = round(avg_score, 1)
            else:
                avg_score = 0
    
    context = {
        'student': student,
        'in_progress_enrollments': in_progress_enrollments,
        'completed_enrollments': completed_enrollments,
        'recommended_courses': recommended_courses,
        'total_courses': total_courses,
        'completed_courses': completed_courses,
        'certificates_count': certificates_count,
        'avg_score': avg_score
    }
    
    return render(request, 'studentDashboard.html', context)


@login_required
def student_profile(request):
    user = request.user
    try:
        student = Student.objects.get(id=user.id)
        context = {'student': student}
        return render(request, 'studentProfile.html', context)
    except Student.DoesNotExist:
        return HttpResponseForbidden("You do not have permission to access this page.")


@login_required
def course_details(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    student = get_object_or_404(Student, id=request.user.id)
    enrollment = get_object_or_404(Enrollment, student=student, course=course)
    
    incomplete_tracker = ProgressTracker.objects.filter(
        enrollment=enrollment, 
        is_completed=False
    ).order_by('subchapter__chapter__position', 'subchapter__position').first()
    
    current_subchapter = None
    current_quiz = None
    
    if incomplete_tracker:
        current_subchapter = incomplete_tracker.subchapter
        
        incomplete_quiz_result = QuizResult.objects.filter(
            progress=incomplete_tracker,
            is_completed=False
        ).order_by('question__quizz__id').first()
        
        if incomplete_quiz_result:
            current_quiz = incomplete_quiz_result.question.quizz
            
    else:
        first_chapter = course.chapters.order_by('position').first()
        current_subchapter = first_chapter.subchapters.order_by('position').first()
        if current_subchapter:
            progress, created = ProgressTracker.objects.get_or_create(
                enrollment=enrollment,
                subchapter=current_subchapter,
                defaults={'is_completed': False, 'start_date': timezone.now()}
            )
                
            if created and current_subchapter.quizzes.exists(): 
                for quiz in current_subchapter.quizzes.all():
                    for question in quiz.questions.all():
                        QuizResult.objects.get_or_create(
                            progress=progress,
                            question=question,
                            defaults={'is_completed': False, 'start_time': timezone.now()}
                        )
    
    next_exists = False
    if current_subchapter:
        if current_quiz:
            next_quiz_exists = Quizz.objects.filter(
                subchapter=current_subchapter,
                id__gt=current_quiz.id
            ).exists()
            
            if next_quiz_exists:
                next_exists = True
            
            else:
                next_exists = check_next_subchapter(course, current_subchapter)
                
        else:
            if current_subchapter.quizzes.exists():
                next_exists = True
            else:
                next_exists = check_next_subchapter(course, current_subchapter)
    
    return render(request, 'student_course.html', {
        'course': course,
        'enrollment': enrollment,
        'current_subchapter': current_subchapter,
        'current_quiz': current_quiz,
        'next_exists': next_exists,
    })


def check_next_subchapter(course, current_subchapter):
    return Subcapitol.objects.filter(
        chapter__course=course,
        chapter__position__gte=current_subchapter.chapter.position
    ).filter(
        Q(chapter__position__gt=current_subchapter.chapter.position) |
        Q(chapter=current_subchapter.chapter, position__gt=current_subchapter.position)
    ).exists()



def get_next_subchapter(course, current_subchapter):
    return Subcapitol.objects.filter(
        chapter__course=course,
        chapter__position__gte=current_subchapter.chapter.position
    ).filter(
        Q(chapter__position__gt=current_subchapter.chapter.position) |
        Q(chapter=current_subchapter.chapter, position__gt=current_subchapter.position)
    ).order_by('chapter__position', 'position').first()
    
    
@login_required
def mark_next(request):
    try:
        data = json.loads(request.body)
        subchapter_id = data.get('subchapter_id')
        
        subchapter = get_object_or_404(Subcapitol, id=subchapter_id)
        student = get_object_or_404(Student, id=request.user.id)
        enrollment = get_object_or_404(Enrollment, student=student, course=subchapter.chapter.course)
        
        progress = get_object_or_404(ProgressTracker, enrollment=enrollment, subchapter=subchapter)
        
        if subchapter.quizzes.exists():
            first_quiz = None
            for quiz in subchapter.quizzes.all():
                for question in quiz.questions.all():
                    result, created = QuizResult.objects.get_or_create(
                        progress=progress,
                        question=question,
                        defaults={'is_completed': False, 'start_time': timezone.now()}
                    )
                    
                    if created or not result.is_completed:
                        if not first_quiz or quiz.id < first_quiz.id:
                            first_quiz = quiz
            
            if first_quiz:
                return JsonResponse({
                    'success': True,
                    'next_type': 'quiz',
                    'quiz_id': first_quiz.id,
                    'quiz_title': first_quiz.title,
                    'questions': get_quiz_questions(first_quiz)
                })
        
        progress.is_completed = True
        progress.completion_date = timezone.now()
        progress.save()
        
        next_subchapter = get_next_subchapter(enrollment.course, subchapter)
        
        if next_subchapter:
            next_progress, created = ProgressTracker.objects.get_or_create(
                enrollment=enrollment,
                subchapter=next_subchapter,
                defaults={'is_completed': False, 'start_date': timezone.now()}
            )

            if not created and not next_progress.start_date:
                next_progress.start_date = timezone.now()
                next_progress.save()
            
            return JsonResponse({
                'success': True,
                'next_type': 'subchapter',
                'subchapter_id': next_subchapter.id,
                'title': next_subchapter.title,
                'content': next_subchapter.content,
                'next_exists': True 
            })
        
        else:
            
            total_quiz_questions = QuizResult.objects.filter(
                progress__enrollment=enrollment,
                is_completed=True
            ).count()
            
            correct_answers = QuizResult.objects.filter(
                progress__enrollment=enrollment,
                is_completed=True,
                is_correct=True
            ).count()
            
            score_percentage = 0
            if total_quiz_questions > 0:
                score_percentage = (correct_answers / total_quiz_questions) * 100
            
            score_percentage = round(score_percentage, 2)
            
            enrollment.progress = score_percentage
            enrollment.status = 'completed'
            enrollment.save()
            
            if score_percentage >= 75:
                message = f"Felicitări! Ai finalizat cursul cu un scor de {score_percentage}%. Poți cere diploma dacă dorești."
            else:
                message = f"Ai finalizat cursul cu un scor de {score_percentage}%. Pentru a primi diploma, este necesar un scor minim de 75%."
            
            return JsonResponse({
                'success': True,
                'next_type': 'completed',
                'completed': True,
                'message': message,
                'score': score_percentage,
                'passed': score_percentage >= 75
            })
            
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


def get_quiz_questions(quiz):
    questions = []

    for question in quiz.questions.all():
        q_data = {
            'id': question.id,
            'text': question.text,
            'answers': []
        }

        for answer in question.answers.all():
            q_data['answers'].append({
                'id': answer.id,
                'text': answer.text
            })
        questions.append(q_data)

    return questions


@login_required
def submit_quiz(request, quiz_id):
    try:
        quiz = get_object_or_404(Quizz, id=quiz_id)
        student = get_object_or_404(Student, id=request.user.id)
        enrollment = get_object_or_404(Enrollment, student=student, course=quiz.subchapter.chapter.course)
        
        progress, _ = ProgressTracker.objects.get_or_create(
            enrollment=enrollment,
            subchapter=quiz.subchapter
        )
        
        feedback = []
        for question in quiz.questions.all():
            selected_answer_id = request.POST.get(f'question_{question.id}')
            
            answer = get_object_or_404(Answer, id=selected_answer_id)
            is_correct = answer.is_correct
                
            quiz_result, _ = QuizResult.objects.get_or_create(
                progress=progress,
                question=question,
                defaults={'is_correct': False, 'is_completed': False}
            )
            quiz_result.is_correct = is_correct
            quiz_result.attempted_on = timezone.now()
            quiz_result.is_completed = True
            quiz_result.save()
                
            feedback.append({
                'question': question.text,
                'is_correct': is_correct,
                'correct_answer': None if is_correct else question.answers.filter(is_correct=True).first().text
            })
        
        next_quiz = Quizz.objects.filter(
            subchapter=quiz.subchapter,
            id__gt=quiz.id
        ).order_by('id').first()
        
        if next_quiz:
            return JsonResponse({
                'success': True,
                'next_type': 'quiz',
                'quiz_id': next_quiz.id,
                'quiz_title': next_quiz.title,
                'feedback': feedback,
                'questions': get_quiz_questions(next_quiz)
            })
            
        else:
            all_completed = not QuizResult.objects.filter(
                progress=progress,
                is_completed=False
            ).exists()
            
            if all_completed:
                progress.is_completed = True
                progress.completion_date = timezone.now()
                progress.save()
            
            next_exists = check_next_subchapter(enrollment.course, quiz.subchapter)
            
            if not next_exists and all_completed:
                total_quiz_questions = QuizResult.objects.filter(
                    progress__enrollment=enrollment,
                    is_completed=True
                ).count()
                
                correct_answers = QuizResult.objects.filter(
                    progress__enrollment=enrollment,
                    is_completed=True,
                    is_correct=True
                ).count()
                
                score_percentage = 0
                if total_quiz_questions > 0:
                    score_percentage = (correct_answers / total_quiz_questions) * 100
                
                score_percentage = round(score_percentage, 2)
                
                enrollment.progress = score_percentage
                enrollment.status = 'completed'
                enrollment.save()
                
                if score_percentage >= 75:
                    message = f"Felicitări! Ai finalizat cursul cu un scor de {score_percentage}%. Poți cere diploma dacă dorești."
                else:
                    message = f"Ai finalizat cursul cu un scor de {score_percentage}%. Pentru a primi diploma, este necesar un scor minim de 75%."
                
                return JsonResponse({
                    'success': True,
                    'next_type': 'completed',
                    'feedback': feedback,  
                    'completed': True,
                    'message': message,
                    'score': score_percentage,
                    'passed': score_percentage >= 75
                })
            
            return JsonResponse({
                'success': True,
                'next_type': 'feedback',
                'feedback': feedback,
                'next_exists': next_exists,
                'subchapter_id': quiz.subchapter.id
            })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
 
    
@login_required
def request_certificate(request, enrollment_id):

    enrollment = get_object_or_404(Enrollment, id=enrollment_id, student=request.user)
    
    existing_certificate = Certificate.objects.filter(enrollment=enrollment, status='pending').first()
    
    if not existing_certificate:

        Certificate.objects.create(enrollment=enrollment)
    
    return redirect('student_dashboard')