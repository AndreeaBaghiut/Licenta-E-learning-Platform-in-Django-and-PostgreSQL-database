import json
import os
from django.core.files.storage import default_storage
from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.http import require_http_methods

from Licenta import settings
from teacher_dashboard.models import Course, Capitol, Subcapitol, Category, Quizz, Question, Answer, IndependentExercise, InterviewQuestion
from teacher_dashboard.forms import CourseForm, IndependentExercise, IndependentExerciseForm, TestCase, TestCaseForm, TestCaseFormSet, InterviewQuestionForm
from user.models import Teacher
from django.http import JsonResponse
from django.db.models import Max
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.contrib import messages
from django.forms import modelformset_factory
from .utils import Judge0Client
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from student_dashboard.models import Enrollment, QuizResult, ProgressTracker, Certificate
from django.db.models import Avg
from django.db.models import DecimalField
from decimal import Decimal
from PIL import Image, ImageDraw, ImageFont
import qrcode
from io import BytesIO
from django.utils import timezone
from django.core.mail import EmailMessage


@login_required
def teacher_dashboard(request):
    user = request.user
    try:
        if not request.session.session_key:
            messages.error(request, 'Ai fost delogat din cauza inactivității.')
            return redirect('teacher_login')

        teacher = Teacher.objects.get(id=user.id)
        context = {'teacher': teacher}
        return render(request, 'teacherDashboard.html', context)
    except Teacher.DoesNotExist:
        return HttpResponseForbidden("Nu ai permisiunea să accesezi această pagină.")

@login_required
def teacher_courses(request):
    user = request.user  
    print(user.id)
    try:
        teacher = Teacher.objects.get(id=user.id) 
        print(teacher)
        courses = Course.objects.filter(teacher=teacher)
        print(courses)
        return render(request, 'courses/teacherCourses.html', {'courses': courses})
    except Teacher.DoesNotExist:
        print("profesorul nu a fost gasit")
        return HttpResponseForbidden("Nu ai permisiunea să accesezi această pagină.")
    

def teacher_course(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    
    course_categories = course.categories.all()
    course_category_ids = [str(cat.id) for cat in course_categories]
    
    context = {
        'course': course,
        'course_categories': course_categories,
        'course_category_ids': course_category_ids,
    }
    return render(request, 'courses/teacherCourse.html', context)


def get_categories(request):

    categories = Category.objects.all()

    categories_data = [{'id': category.id, 'name': category.name} for category in categories]

    return JsonResponse({'success': True, 'categories': categories_data})


@login_required
@require_http_methods(['GET', 'POST'])
def add_course(request):

    if request.method == 'POST':
        form = CourseForm(request.POST, request.FILES)
        if form.is_valid():
            course = form.save(commit=False)

            course.teacher = Teacher.objects.get(id=request.user.id)
            course.save() 

            category_ids = request.POST.getlist('categories') 

            for category_id in category_ids:
                category = Category.objects.get(id=category_id)
                course.categories.add(category)

            course.save()  

            return redirect('teacher_courses') 
    else:
        form = CourseForm()

    categories = Category.objects.all()
    return render(request, 'courses/addCourse.html', {'form': form, 'categories': categories})


@require_http_methods(['POST'])
def delete_course(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    course.delete()
    return redirect('teacher_courses')


@require_http_methods(['POST'])
def update_course(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    categories_ids = request.POST.getlist('categories')  

    course.categories.clear()
    
    for category_id in categories_ids:
        category = Category.objects.get(id=category_id)
        course.categories.add(category)

    course.name = request.POST.get('name', course.name)
    course.description = request.POST.get('description', course.description)

    if request.FILES.get('course_image'): 
        course.course_image = request.FILES['course_image']

    course.save()

    return JsonResponse({'success': True})



@require_http_methods(['GET', 'POST'])
def edit_course(request, course_id):
    course = get_object_or_404(Course, pk=course_id)

    if request.method == 'POST':
        form = CourseForm(request.POST, request.FILES, instance=course)
        if form.is_valid():
            form.save()
            return redirect('course_detail', course_id=course.id)
    else:
        form = CourseForm(instance=course)

    return render(request, 'editCourse.html', {'form': form, 'course': course, 'is_published': course.is_published  })



def add_chapter(request, course_id):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        chapter_title = data.get("title")
        print("am primit: ", chapter_title, course_id)

        if chapter_title:
            course = get_object_or_404(Course, id=course_id)
            max_position = Capitol.objects.filter(course=course).aggregate(Max('position'))['position__max'] or 0
            
            new_chapter = Capitol.objects.create(title=chapter_title, course=course, position=max_position+1)
            
            return JsonResponse({'success': True, 'chapter_id': new_chapter.id, 'chapter_title': new_chapter.title})
        return JsonResponse({'success': False, 'error': 'Invalid data'})
    return JsonResponse({'success': False, 'error': 'Invalid method'})

            
@require_http_methods(['DELETE'])
def delete_chapter(request, chapter_id):
    chapter = Capitol.objects.filter(id=chapter_id)
    chapter.delete()
        
    return JsonResponse({'success': True})
    
    
@require_http_methods(['POST'])
def update_chapter(request, chapter_id):
    data = json.loads(request.body)
    new_title = data.get('title')
    print("am primit titlu: ", new_title)
        
    if new_title:
        chapter = Capitol.objects.get(id=chapter_id)
        chapter.title = new_title
        chapter.save()
            
        return JsonResponse({"success": True, "chapter_title": chapter.title})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid title.'})
            
              
        

@require_http_methods(["POST"])
def add_subchapter(request, chapter_id):
    data = json.loads(request.body)
    print("am primit: ", data)
    title_subchapter = data.get("subchapterTitle")
    if title_subchapter:
        chapter = Capitol.objects.get(id=chapter_id)
        max_position = Subcapitol.objects.filter(chapter=chapter).aggregate(Max('position'))['position__max'] or 0
        new_subchapter = Subcapitol.objects.create(title=title_subchapter, chapter_id=chapter_id, position=max_position + 1, is_published=False)
        return JsonResponse({'success': True, "subchapter_id": new_subchapter.id, "subchapter_title": new_subchapter.title})
    return JsonResponse({'success': False, 'error': 'Invalid data'})



@require_http_methods(["POST"])
def save_subchapter_content(request):
    data = json.loads(request.body)
    print("primit: ",data)
    
    subchapter_id = data.get('subchapter_id')
    subchapter_new_content = data.get('content')
    subchapter = Subcapitol.objects.get(id=subchapter_id)
    if subchapter_new_content:
        subchapter.content = subchapter_new_content
        subchapter.save()
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'subch not found.' })

            
@require_http_methods(["GET"])
def get_subchapter_content(request, subchapter_id):
    print("Am primit cererea.")
    print("am primit id: ",subchapter_id)
    
    subchapter = Subcapitol.objects.get(id=subchapter_id)
    subchapter_content = subchapter.content
    return JsonResponse({'success': True, 'content': subchapter_content, 'subchapter_id': subchapter_id})
        
        
@require_http_methods(['DELETE'])
def delete_subchapter(request, subchapter_id):
    print("am primit cererea de delete cu id la subcapitol", subchapter_id)
    
    subchapter = Subcapitol.objects.get(id=subchapter_id)
    subchapter.delete()
    return JsonResponse({'success': True, 'subchapter_id': subchapter_id})
        
        
@require_http_methods(["POST"])
def update_subchapter_title(request, subchapter_id):
    data = json.loads(request.body)
    print("Am primit in cererea de modificare a titlului: ",data)
    new_title = data.get("title")
    if new_title:
        subchapter = Subcapitol.objects.get(id=subchapter_id)
        subchapter.title = new_title
        subchapter.save()
        return JsonResponse({"success": True, "chapter_title": new_title})
    else:
        return JsonResponse({"success": False, "error": "Invalid title."})

    

def upload_image(request):
    if (request.method == "POST" and request.FILES.get("image")):
        image = request.FILES["image"]
        
        folder_path = "subchapter_images/"
        image_path = os.path.join(folder_path, image.name)
        
        path = default_storage.save(image_path, image)
        public_url = f'{settings.MEDIA_URL}{path}'
        
        return JsonResponse({'url': public_url})
    return JsonResponse({'error': 'Invalid request'}, status=400)


def upload_video(request):
    if (request.method == "POST" and request.FILES.get("video")):
        video = request.FILES["video"]
        
        folder_path = "subchapters_video/"
        video_path = os.path.join(folder_path, video.name)
        
        path = default_storage.save(video_path, video)
        public_url = f'{settings.MEDIA_URL}{path}'
        
        return JsonResponse({'url': public_url})
    return JsonResponse({'error': 'Invalid request'}, status=400)


@require_http_methods(["POST"])
def publish_course(request):
    data = json.loads(request.body)
    course_id = data.get("course_id")
    course = Course.objects.get(id=course_id)
    if course:
        chapters = Capitol.objects.filter(course_id=course_id, is_published=False)
        chapters.update(is_published=True)
        
        subchapters = Subcapitol.objects.filter(chapter__course_id=course_id, is_published=False)
        subchapters.update(is_published=True)
        
        quizzes = Quizz.objects.filter(subchapter__chapter__course_id=course_id, is_published=False)
        quizzes.update(is_published=True)
        
        if not course.is_published:
            course.is_published = True
            course.save()
        
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Course not found.'})
        
        
        
@require_http_methods(["POST"])
def add_quiz(request, subchapter_id):
    subchapter = Subcapitol.objects.get(pk=subchapter_id)
    quiz_title = f"Q{subchapter.quizzes.count() + 1}"
    quiz = Quizz.objects.create(subchapter=subchapter, title=quiz_title)
    return JsonResponse({'success': True, 'quiz_id': quiz.id, 'quiz_title': quiz_title})
    


def delete_quiz(request, quiz_id):
    if request.method == "DELETE":
        quiz = get_object_or_404(Quizz, id=quiz_id)
        quiz.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)


@require_http_methods(["POST"])
def save_quiz_content(request, quiz_id):
    data = json.loads(request.body)
    question_text = data.get('question')
    answers = data.get('answers', [])

    quiz = Quizz.objects.get(pk=quiz_id)

    if quiz.questions.exists():
        question = quiz.questions.first()
        question.text = question_text
        question.save()
        
    else:
        question = Question.objects.create(quizz=quiz, text=question_text)

    response_answers = []

    for answer_data in answers:
        answer_id = answer_data.get('id')
        if answer_id:
            answer = Answer.objects.get(pk=answer_id)
            answer.text = answer_data['text']
            answer.is_correct = answer_data.get('is_correct', False)
            answer.save()
        else:
            answer = Answer.objects.create(
                question=question,
                text=answer_data['text'],
                is_correct=answer_data.get('is_correct', False)
            )

        response_answers.append({
            'id': answer.id,
            'text': answer.text,
            'is_correct': answer.is_correct
        })

    return JsonResponse({'success': True, 'data': {'answers': response_answers}})


def delete_answer(request, answer_id):
    if request.method == "DELETE":
        answer = get_object_or_404(Answer, id=answer_id)
        answer.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)


@require_http_methods(["GET"])
def get_quiz_content(request, quiz_id):
    quiz = Quizz.objects.get(pk=quiz_id)
    
    question = quiz.questions.first() 
    
    quiz_data = {
        'id': quiz.id,
        'title': quiz.title,
        'questions': []
    }
    
    if question:

        answers = question.answers.all()
        answers_data = [
            {
                'id': answer.id,
                'text': answer.text,
                'is_correct': answer.is_correct
            } for answer in answers
        ]
        
        quiz_data['questions'].append({
            'id': question.id,
            'text': question.text,
            'answers': answers_data
        })
    
    return JsonResponse({'success': True, 'quiz': quiz_data})
    


@login_required
def teacher_profile(request):
    teacher = Teacher.objects.get(id=request.user.id)
    context = {'teacher': teacher}
    return render(request, 'teacherProfile.html', context)



@login_required
def exercises_view(request):

    teacher = request.user.teacher
    exercises = IndependentExercise.objects.filter(created_by=teacher)

    return render(request, 'exercises.html', {'exercises': exercises})


@require_http_methods(["GET", "POST"])
@login_required
def add_independent_exercise(request):

    TestCaseFormSet = modelformset_factory(
        TestCase,
        form=TestCaseForm,
        extra=3 
    )

    if request.method == "POST":
        exercise_form = IndependentExerciseForm(request.POST)
        test_case_formset = TestCaseFormSet(request.POST, queryset=TestCase.objects.none())
    else:
        exercise_form = IndependentExerciseForm()
        test_case_formset = TestCaseFormSet(
            queryset=TestCase.objects.none(), 
            initial=[{'input_data': '', 'expected_output': ''} for _ in range(3)]
        )
    
    return render(request, 'addExercise.html', {
        'exercise_form': exercise_form,
        'test_case_formset': test_case_formset,
    })
    
        

@require_http_methods(['POST']) 
def run_tests(request):
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        data = json.loads(request.body)
        print("Request body: ")
        print(request.body)
        
        judge0 = Judge0Client()
        validation_result = judge0.validate_solution(
            language=data['programming_language'],
            source_code=data['reference_solution'],
            test_cases=data['test_cases']
        )
        
        return JsonResponse(validation_result)
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})
    
    
@require_http_methods(['POST'])
@login_required
def save_exercise(request):
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        data = json.loads(request.body)
        user = Teacher.objects.get(id=request.user.id)

        exercise_id = data.get('exercise_id')
        #print("id primit: ", exercise_id)
        
        if exercise_id is None:
            print("Creare exercițiu nou")
                
            exercise = IndependentExercise(
                title = data['title'],
                description = data.get('description', ''),
                difficulty = data.get('difficulty', 'beginner'),
                programming_language = data['programming_language'],
                reference_solution = data['reference_solution'],
                is_published = False,
                created_by = user
            )
            exercise.save()
        
        else:
            exercise_id = int(exercise_id)
            exercise = get_object_or_404(IndependentExercise, id=exercise_id, created_by=user)
                    
            exercise.title = data['title']
            exercise.description = data.get('description', '')
            exercise.difficulty = data.get('difficulty', 'beginner')
            exercise.programming_language = data['programming_language']
            exercise.reference_solution = data['reference_solution']
            exercise.is_published = False
            exercise.save()
                    
            TestCase.objects.filter(object_id=exercise.id).delete()
            
        content_type = ContentType.objects.get_for_model(IndependentExercise)
            
        test_cases = [
            TestCase(
                content_type = content_type,
                object_id = exercise.id,
                input_data = test_case['input_data'],
                expected_output = test_case['expected_output']
            )
            for test_case in data['test_cases']
        ]
        
        TestCase.objects.bulk_create(test_cases)
            
        return JsonResponse({'success': True, 'url': reverse('teacher_exercises')})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
@require_http_methods(['GET', 'POST', 'DELETE'])
def edit_exercise(request, id):
    exercise = get_object_or_404(IndependentExercise, id=id)
    
    exercise_form = IndependentExerciseForm(request.POST or None, instance=exercise)
    
    content_type = ContentType.objects.get_for_model(IndependentExercise)

    test_case_formset = TestCaseFormSet(
        request.POST or None,
        queryset=TestCase.objects.filter(content_type=content_type, object_id=exercise.id)
    )
    
    return render(request, 'editExercise.html', {
        'exercise': exercise,
        'exercise_form': exercise_form,
        'test_case_formset': test_case_formset,
    })
    

def delete_exercise(request, id):
    exercise = get_object_or_404(IndependentExercise, id=id)
    TestCase.objects.filter(object_id=exercise.id).delete()
    exercise.delete()
    return redirect('teacher_exercises')
    

@require_http_methods(['POST'])
def publish_exercise(request):
    data = json.loads(request.body)
    exercise_id = data.get("exercise_id")
    exercise = IndependentExercise.objects.get(id=exercise_id)
    if exercise:
        exercise.is_published = True
        exercise.save()
        
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Exercitiul nu a fost gasit.'})
        
        
        
@login_required
def questions_view(request):
    teacher = request.user.teacher
    questions = InterviewQuestion.objects.filter(created_by=teacher)

    return render(request, 'questions.html', {'questions': questions})
    

@require_http_methods(["GET", "POST"])
@login_required
def add_question(request):
    if request.method == "POST":
        question_form = InterviewQuestionForm(request.POST)
        if question_form.is_valid():
            question = question_form.save(commit=False)
            question.created_by = request.user.teacher
            
            question.save() 
            
            categories = request.POST.getlist('categories')
            
            if categories:
                for category_id in categories:
                    category = Category.objects.get(id=category_id)
                    question.categories.add(category) 
                messages.success(request, "Întrebarea a fost adăugată cu succes.")
                return redirect('interview_questions')
            else:
                question.delete()
                messages.error(request, "Trebuie să selectați cel puțin o categorie.")
    else:
        question_form = InterviewQuestionForm()
    
    return render(request, 'addQuestion.html', {
        'question_form': question_form,
    })



@login_required
@require_http_methods(['GET', 'POST'])
def edit_question(request, id):

    question = get_object_or_404(InterviewQuestion, id=id)
    
    if request.method == 'POST':

        question_form = InterviewQuestionForm(request.POST, instance=question)
        if question_form.is_valid():

            question = question_form.save(commit=False)
            question.save()
            
            categories = request.POST.getlist('categories')
            if categories:

                question.categories.clear()
                for category_id in categories:
                    category = Category.objects.get(id=category_id)
                    question.categories.add(category)
                                    
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'message': 'Întrebarea a fost actualizată cu succes.',
                    })
            else:
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False,
                        'errors': {'categories': 'Trebuie să selectați cel puțin o categorie.'}
                    })
                
                messages.error(request, "Trebuie să selectați cel puțin o categorie.")
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': question_form.errors
                })
            
    else:  
        
        question_form = InterviewQuestionForm(instance=question)
    
    selected_categories = [category.id for category in question.categories.all()]
    
    return render(request, 'editQuestion.html', {
        'question': question,
        'question_form': question_form,
        'selected_categories': selected_categories,
    })
    

def delete_question(request, id):
    question = get_object_or_404(InterviewQuestion, id=id)    
    question.delete()
    messages.success(request, "Intrebarea a fost stearsa cu succes.")
    return redirect('interview_questions')


@require_http_methods(['POST'])
def publish_question(request):
    data = json.loads(request.body)
    question_id = data.get("question_id")
    question = InterviewQuestion.objects.get(id=question_id)
    if question:
        question.is_published = True
        question.save()
        
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Intrebarea nu a fost gasita.'})
        
        

def statistics_view(request):

    teacher = Teacher.objects.get(id=request.user.id)
    
    teacher_courses = Course.objects.filter(teacher=teacher)
    
    if not teacher_courses.exists():
        return render(request, 'teacherDashboard.html', {
            'teacher': teacher,
            'no_courses': True
        })
    
    course_id = request.GET.get('course_id')
    if course_id:
        selected_course = get_object_or_404(Course, id=course_id, teacher=teacher)
    else:
        selected_course = teacher_courses.first()
    
    enrollments = Enrollment.objects.filter(course=selected_course)  
    enrolled_students_count = enrollments.count()  
    completed_count = enrollments.filter(status='completed').count()   
    
    avg_score = enrollments.filter(status='completed').aggregate(
        avg=Avg('progress', output_field=DecimalField())
    )['avg'] or Decimal('0.0')
    avg_score = round(avg_score, 1)
    
    certificate_count = Certificate.objects.filter(
        enrollment__course=selected_course,
        status='approved'
    ).count()
    
    pending_certificates = Certificate.objects.filter(
        enrollment__course=selected_course,
        status='pending'
    ).order_by('issue_date')
    
    for cert in pending_certificates:

        time_spent = calculate_time_spent(cert.enrollment)
        cert.total_time_spent = format_time_spent(time_spent)
        
        cert.risk_level = calculate_risk_level(cert.enrollment, time_spent)
        
        risk_displays = {
            'low': 'Risc scăzut',
            'medium': 'Risc mediu',
            'high': 'Risc ridicat'
        }
        cert.risk_level_display = risk_displays.get(cert.risk_level, 'Necunoscut')
    
    context = {
        'teacher': teacher,
        'teacher_courses': teacher_courses,
        'selected_course': selected_course,
        'enrolled_students_count': enrolled_students_count,
        'completed_count': completed_count,
        'avg_score': avg_score,
        'certificate_count': certificate_count,
        'pending_certificates': pending_certificates
    }
    
    return render(request, 'statistics.html', context)


def calculate_time_spent(enrollment):
    total_seconds = 0
    
    trackers = ProgressTracker.objects.filter(
        enrollment=enrollment,
        is_completed=True,
        start_date__isnull=False,
        completion_date__isnull=False
    )
    
    for tracker in trackers:
        
        diff = (tracker.completion_date - tracker.start_date).total_seconds()

        diff = min(diff, 7200)
        total_seconds += diff
    
    quiz_results = QuizResult.objects.filter(
        progress__enrollment=enrollment,
        is_completed=True,
        start_time__isnull=False
    )
    
    for quiz_result in quiz_results:
        diff = (quiz_result.attempted_on - quiz_result.start_time).total_seconds()

        diff = min(diff, 180)
        total_seconds += diff
    
    return total_seconds


def format_time_spent(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours}h {minutes}m"


def calculate_risk_level(enrollment, time_spent):
    subchapter_count = Subcapitol.objects.filter(chapter__course=enrollment.course).count()
    
    expected_time = subchapter_count * 15 * 60
    
    quiz_results = QuizResult.objects.filter(
        progress__enrollment=enrollment,
        is_completed=True
    )
    
    avg_time_per_question = 0
    
    if quiz_results.exists():
        quiz_results_with_times = [r for r in quiz_results if r.attempted_on and r.start_time]
        if quiz_results_with_times:
            total_quiz_time = sum([(r.attempted_on - r.start_time).total_seconds() for r in quiz_results_with_times])
            avg_time_per_question = total_quiz_time / len(quiz_results_with_times)
    
    avg_time_per_subchapter = time_spent / max(subchapter_count, 1) / 60
    
    if (time_spent < expected_time * 0.3 or 
        avg_time_per_question < 10 or 
        avg_time_per_subchapter > 60 or 
        avg_time_per_question > 60):   
        return 'high'
    
    elif (time_spent < expected_time * 0.6 or 
          avg_time_per_question < 20 or
          avg_time_per_subchapter > 40 or 
          avg_time_per_question > 45):     
        return 'medium'
    
    else:
        return 'low'
    
    

@login_required
def process_certificate(request, certificate_id):

    teacher = Teacher.objects.get(id=request.user.id)
    
    certificate = get_object_or_404(Certificate, id=certificate_id)
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'approve':
            certificate.status = 'approved'
            certificate.approver = teacher
            certificate.action_date = timezone.now()
            certificate.save()
            
            send_certificate_email(certificate)
                    
        elif action == 'reject':
            certificate.status = 'rejected'
            certificate.approver = teacher
            certificate.action_date = timezone.now()
            certificate.save()
            
            send_rejection_email(certificate)
            
            messages.success(request, "Certificatul a fost respins și studentul a fost notificat.")
    
    return redirect('statistics')


def generate_certificate_pdf(certificate):
    
    template_path = f"{settings.MEDIA_ROOT}/certificate_templates/template.png"
    
    template = Image.open(template_path)
    
    draw = ImageDraw.Draw(template)
    
    font = ImageFont.load_default()
    
    course_name = certificate.enrollment.course.name
    
    course_position = (template.width // 2, 1300)
       
    text_width = draw.textlength(course_name, font=font)
    draw.text((course_position[0] - text_width/2, course_position[1]), 
              course_name, 
              font=font, 
              fill=(0, 0, 0))
    
    verify_url = f"{settings.SITE_URL}/teacher_dashboard/verify/{certificate.certificate_uuid}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=5,
        border=2,
    )

    qr.add_data(verify_url)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_img = qr_img.resize((80, 80))
    
    qr_position = (template.width - 150, template.height - 140)
    
    template.paste(qr_img, qr_position)
    
    buffer = BytesIO() 
    template_rgb = template.convert('RGB') 
    template_rgb.save(buffer, format='PDF') 
    
    buffer.seek(0)
    
    return buffer
   
    

def send_certificate_email(certificate):

    subject = f"Certificat de absolvire - {certificate.enrollment.course.name}"
    
    email_body = f"""
    Felicitări {certificate.enrollment.student.username}!
    
    Ai absolvit cu succes cursul "{certificate.enrollment.course.name}" cu un scor de {certificate.enrollment.progress}%.
    
    Certificatul tău oficial este atașat acestui email.
    
    Cu stimă,
    Echipa platformei
    """
    
    pdf_file = generate_certificate_pdf(certificate)
    
    email = EmailMessage(
        subject,
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        [certificate.enrollment.student.email]
    )
    
    email.attach(f'certificat_{certificate.enrollment.course.name}.pdf', pdf_file.getvalue(), 'application/pdf')
    email.send()
    
    
def verify_certificate(request, uuid):
    certificate = get_object_or_404(Certificate, certificate_uuid=uuid)
    
    context = {
        'certificate': certificate,
        'student': certificate.enrollment.student,
        'course': certificate.enrollment.course,
        'issue_date': certificate.action_date,
        'is_valid': certificate.status == 'approved'
    }
    
    return render(request, 'verify_certificate.html', context)


def send_rejection_email(certificate):

    subject = f"Cerere de certificat respinsă - {certificate.enrollment.course.name}"
    
    email_body = f"""
    Salut {certificate.enrollment.student.username},
    
    Cererea ta pentru certificatul de absolvire a cursului "{certificate.enrollment.course.name}" a fost respinsă.
    
    Cu stimă,
    Echipa platformei
    """
    
    email = EmailMessage(
        subject,
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        [certificate.enrollment.student.email]
    )
    
    email.send()