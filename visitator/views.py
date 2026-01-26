from django.shortcuts import redirect, render, get_object_or_404
from django.template.loader import render_to_string

from student_dashboard.models import Enrollment
from teacher_dashboard.models import Course, Category
from user.models import Teacher, Student
from teacher_dashboard.models import Exercise, TestCase, IndependentExercise, InterviewQuestion
import random, json
from teacher_dashboard.utils import Judge0Client
from django.db.models import Count
import stripe
from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse


def home(request):
    if request.user.is_authenticated:
        try:
            Teacher.objects.get(id=request.user.id)
            return redirect('teacher_dashboard')
        except Teacher.DoesNotExist:
            pass 

        try:
            Student.objects.get(id=request.user.id)
            return redirect('student_dashboard')
        except Student.DoesNotExist:
            pass
        
    
    popular_courses = Course.objects.filter(is_published=True) \
        .annotate(student_count=Count('enrollments')) \
            .order_by('-student_count')[:3] 
            
    context = {
        'popular_courses': popular_courses
    }
    return render(request, 'visitator/home.html', context)


def explore(request):
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True

    popular_courses = Course.objects.filter(is_published=True) \
        .annotate(student_count=Count('enrollments')) \
        .order_by('-student_count')[:9] 
        
    grouped_courses = []
    for i in range(0, len(popular_courses), 3):
        group = popular_courses[i:i+3]
        if len(group) == 3:  
            grouped_courses.append(group)

    all_courses = Course.objects.filter(is_published=True)

    categories = Category.objects.filter(category_type='general')
    languages = Category.objects.filter(category_type='language')

    return render(request, 'visitator/explore.html', {
        'popular_courses': popular_courses,
        'grouped_courses': grouped_courses,
        'all_courses': all_courses,
        'categories': categories,
        'languages': languages,
        'is_student': is_student,
    })


def filter_courses(request):
    category_ids = request.GET.get('categories', '')
    language_ids = request.GET.get('languages', '')

    filtered_courses = Course.objects.filter(is_published=True)

    if category_ids:
        category_ids = category_ids.split(',')
        filtered_courses = filtered_courses.filter(categories__id__in=category_ids).distinct()

    if language_ids:
        language_ids = language_ids.split(',')
        filtered_courses = filtered_courses.filter(categories__id__in=language_ids).distinct()

    course_list_html = render_to_string('course_list.html', {'all_courses': filtered_courses})

    return JsonResponse({'html': course_list_html})


def course_detail(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    is_student = False
    is_enrolled = False
    course_completed = False

    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
        
        try:
            enrollment = Enrollment.objects.get(student=request.user.student, course=course)
            is_enrolled = True
            
            if enrollment.status == 'completed':
                course_completed = True
        except Enrollment.DoesNotExist:
            is_enrolled = False

    return render(request, 'visitator/course.html', {
        'course': course,
        'is_student': is_student,
        'is_enrolled': is_enrolled,
        'course_completed': course_completed
    })


def enroll_course(request, course_id):
    user = request.user
    if not request.user.is_authenticated:
        return redirect('student_login')

    if not hasattr(request.user, 'student'):
        return redirect('student_login')

    student = Student.objects.get(id=user.id)
    course = get_object_or_404(Course, id=course_id)

    Enrollment.objects.get_or_create(student=student, course=course)

    return redirect('student_dashboard_course', course_id=course.id)


def solve_exercises(request):
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
        
    languages = [lang[0] for lang in Exercise.PROGRAMMING_LANGUAGES]
    difficulties = [diff[0] for diff in IndependentExercise.DIFFICULTY_LEVELS]
    
    exercises = IndependentExercise.objects.filter(is_published=True)
    
    return render(request, 'solve_exercises.html', {
        'exercises': exercises,
        'languages': languages,
        'difficulties': difficulties,
        'is_student': is_student,
    })
    

def get_random_exercise(request):  
    language = request.GET.get("language")
    difficulty = request.GET.get("difficulty")
    
    print("primit",language)
    print("primit", difficulty)
    
    exercises = IndependentExercise.objects.filter(programming_language=language, difficulty=difficulty, is_published=True) 
    
    if exercises.exists():
        exercise = random.choice(exercises)
        return JsonResponse({
            "title": exercise.title,
            "description": exercise.description,
            "id": exercise.pk,
        })
        
    return JsonResponse({"title": "Nu a fost gasit niciun exercitiu cu parametrii alesi",
                         "description": "Te rog incearca altceva"})
    
  
def verify_solution(request):
    if request.method == "POST":
        if request.headers.get("X-Requested-With") == 'XMLHttpRequest':
            try:
                data = json.loads(request.body)
                ex_id = data['exercise_id']
                
                test_cases = TestCase.objects.filter(object_id=ex_id)
                test_cases_list = [{
                    "input_data": tc.input_data,
                    "expected_output": tc.expected_output,
                } for tc in test_cases]
            
                judge0 = Judge0Client()
                validation_result = judge0.validate_solution(
                    language = data['programming_language'],
                    source_code = data['proposed_solution'],
                    test_cases = test_cases_list
                )
                
                if validation_result.get("error"):
                    return JsonResponse({
                        "success": False,
                        "error": validation_result.get("error"),
                        "details": validation_result.get("details", "Nu sunt disponibile detalii.")
                    }, status=400)

                test_case_results = []
                for i, tc in enumerate(test_cases_list):
                    actual_output = validation_result["test_results"][i]["actual_output"].strip()
                    test_case_results.append({
                        "input": tc["input_data"],
                        "expected_output": tc["expected_output"],
                        "actual_output": actual_output,
                        "passed": actual_output == tc["expected_output"]
                    })
                    
                all_passed = all(tc["passed"] for tc in test_case_results)
                
                return JsonResponse({
                    "success": all_passed,
                    "test_cases": test_case_results
                }, status=200)

            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON format in request."}, status=400)
            except KeyError as e:
                return JsonResponse({"error": f"Missing key in request: {str(e)}"}, status=400)
            except Exception as e:
                return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)

    return JsonResponse({"error": "Invalid request method."}, status=405)
            
    

def solve_questions(request):
    
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
    
    return render(request, 'answer_questions.html', {
        'is_student': is_student,
    })
    

def get_random_question(request):  
    categories = request.GET.getlist("categories[]") 
    
    print("primit categoriile:", categories)

    questions = InterviewQuestion.objects.filter(
        categories__id__in=categories, 
        is_published=True
    ).distinct() 
    
    if questions.exists():
        question = random.choice(questions)
        
        return JsonResponse({
            "question": question.question,
            "answer": question.answer,
            "id": question.pk,
        })
        
    return JsonResponse({
        "question": "Nu s-a găsit nicio întrebare pentru categoriile selectate",
        "answer": "Te rugăm să încerci alte categorii"
    })
    


def about_us(request):
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
    context = {'is_student': is_student}
    return render(request, 'visitator/about.html', context)



def donate_view(request):
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
    context= {'is_student': is_student,}
    return render(request, 'donate.html', context)


stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(request):
    if request.method == 'POST':
        try:
            amount = int(request.POST.get('amount', 1)) 
            
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': 'Donație pentru educație gratuită',
                            'description': 'Mulțumim pentru susținerea platformei educaționale COD',
                        },
                        'unit_amount': amount * 100,  
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=request.build_absolute_uri(reverse('donation_thank_you')),
                cancel_url=request.build_absolute_uri(reverse('donate')),
            )
            
            return HttpResponseRedirect(checkout_session.url)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return HttpResponseRedirect('donate')


def donation_thank_you(request):
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
    context= {'is_student': is_student,}
    return render(request, 'donation_thank_you.html', context)

