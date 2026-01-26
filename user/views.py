from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate, get_user_model, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import requests
from django.conf import settings
from django.views.decorators.http import require_http_methods

from .forms import StudentRegistrationForm, TeacherRegistrationForm, StudentLoginForm, TeacherLoginForm
from .decorators import user_not_authenticated
from .tokens import account_activation_token
from .models import Student, Teacher
from django.core.mail import EmailMessage, send_mail
from django.urls import reverse
from .forms import PasswordChangeForm

from django.contrib.sessions.models import Session
from django.utils.timezone import now


def login_role(request):
    return render(request, 'user/login_role.html')

def register_role(request):
    return render(request, 'user/registration_role.html')

@user_not_authenticated 
def student_registration(request):
    if request.method == 'POST':
        form = StudentRegistrationForm(data=request.POST)
        recaptcha_response = request.POST.get('g-recaptcha-response')

        if form.is_valid() and verify_recaptcha(recaptcha_response):
            student = form.save(commit=False)
            student.is_active = False
            student.save()
            activateEmail(request, student, form.cleaned_data.get('email'))
            return redirect('student_login')
        else:
            if not verify_recaptcha(recaptcha_response):
                messages.error(request, "reCAPTCHA invalid. Te rugam sa incerci din nou.")
            else:
                messages.error(request, "Forma de date invalida. Te rugam sa incerci din nou.")
            for error in form.errors.items():
                messages.error(request, error)
    else:
        form = StudentRegistrationForm()
    
    context = {
        'form': form,
        'RECAPTCHA_PUBLIC_KEY': settings.RECAPTCHA_PUBLIC_KEY,
    }
    return render(request, 'user/student/student_registration.html', context)


def teacher_registration(request):
    if request.method == 'POST':
        form = TeacherRegistrationForm(request.POST, request.FILES)
        recaptcha_response = request.POST.get('g-recaptcha-response')

        if form.is_valid() and verify_recaptcha(recaptcha_response):
            teacher = form.save(commit=False)
            teacher.set_password(form.cleaned_data['password1'])
            teacher.is_active = False
            teacher.status = 'pending'
            teacher.save()
            activateEmail(request, teacher, form.cleaned_data.get('email'))

            send_mail(
                'Înregistrare nouă profesor în așteptare',
                'Un nou profesor s-a înregistrat și este în așteptarea aprobării. Te rugăm să te conectezi la panoul de administrare pentru verificare.',
                settings.DEFAULT_FROM_EMAIL,
                [settings.ADMIN_EMAIL],
                fail_silently=False,
            )

            return redirect('teacher_login')
        else:
            if not verify_recaptcha(recaptcha_response):
                messages.error(request, "reCAPTCHA invalid. Te rugam sa incerci din nou.")
            else:
                messages.error(request, "Forma de date invalida. Te rugam sa incerci din nou.")
            for error in form.errors.items():
                messages.error(request, error)
    else:
        form = TeacherRegistrationForm()

    context = {
        'form': form,
        'RECAPTCHA_PUBLIC_KEY': settings.RECAPTCHA_PUBLIC_KEY,
    }
    return render(request, 'user/teacher/teacher_registration.html', context)


def activateEmail(request, user, to_email):
    mail_subject = 'Activează-ți contul'
    
    if isinstance(user, Teacher):
        user_display_name = f"{user.name} {user.surname}"
        template = 'user/teacher/check-email.html'
    elif isinstance(user, Student):
        user_display_name = user.username
        template = 'user/student/check-email.html'
    else:
        messages.error(request, 'Tip de utilizator necunoscut')
        return

    message = render_to_string(template, {
        'user': user,
        'domain': get_current_site(request).domain, 
        'uid': urlsafe_base64_encode(force_bytes(user.pk)), 
        'token': account_activation_token.make_token(user),
        'protocol': 'https' if request.is_secure() else 'http' 
    })

    email = EmailMessage(mail_subject, message, to=[to_email])
    email.content_subtype = "html"  

    try:
        email.send()
        messages.success(request, f"{user_display_name}, te rugăm să verifici email-ul primit și să dai click pe link-ul de activare. Verifică și folder-ul spam.")
    except Exception as e:
        messages.error(request, f'Eroare la trimiterea email-ului: {str(e)}')
        
        

def activate(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        if hasattr(user, 'teacher'):
            user.is_active = False
            user.save()
            messages.success(request, "Emailul tău a fost verificat. Contul tău este în așteptarea aprobării administratorului.")
            return redirect('teacher_login')
        elif hasattr(user, 'student'):
            user.is_active = True
            user.save()
            messages.success(request, "Mulțumim pentru confirmarea email-ului. Acum te poți autentifica.")
            return redirect('student_login')
        else:
            messages.error(request, "Tip de utilizator necunoscut!")
            return redirect('home')
    else:
        messages.error(request, "Link-ul de activare este invalid!")
        return redirect('home')


def verify_recaptcha(token):
    data = {
        'secret': settings.RECAPTCHA_PRIVATE_KEY,
        'response': token
    }
    response = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
    result = response.json()
    return result['success']



@user_not_authenticated
def student_login(request):
    if request.method == 'POST':
        form = StudentLoginForm(data=request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            user = authenticate(request, email=email, password=password)

            if user is not None:
                if not user.is_active:
                    messages.error(request, 'Trebuie să îți verifici mai întâi email-ul!')
                    return render(request, 'user/student/student_login.html', {'form': form})

                if hasattr(user, 'student') and user.student.is_student:
                    logout_previous_sessions(user) 
                    login(request, user)  
                    return redirect('student_dashboard')
                else:
                    messages.error(request, 'Nu ai permisiunea să te loghezi aici.')
            else:
                messages.error(request, 'Email sau parolă invalide.')
    else:
        form = StudentLoginForm()

    return render(request, 'user/student/student_login.html', {'form': form})


@user_not_authenticated
def teacher_login(request):
    if request.method == 'POST':
        form = TeacherLoginForm(data=request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            user = authenticate(request, email=email, password=password)

            if user is not None:
                if not user.is_active:
                    messages.error(request, 'Trebuie să îți verifici mai întâi email-ul!')
                    return render(request, 'user/teacher/teacher_login.html', {'form': form})

                if hasattr(user, 'teacher') and user.teacher.is_teacher:
                    logout_previous_sessions(user)  
                    login(request, user) 
                    return redirect('teacher_dashboard')
                else:
                    messages.error(request, 'Nu ai permisiunea să te loghezi aici.')
            else:
                messages.error(request, 'Email sau parolă invalide.')
    else:
        form = TeacherLoginForm()

    return render(request, 'user/teacher/teacher_login.html', {'form': form})


@login_required
def student_teacher_logout(request):
    logout(request)
    messages.info(request, 'Ai fost deconectat.')
    return redirect('/home')



@login_required
@require_http_methods(["POST"])
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)

            if hasattr(user, 'teacher'):
                messages.success(request, 'Parola a fost actualizata cu succes')
                return redirect('teacher_profile') 
            elif hasattr(user, 'student'):
                messages.success(request, 'Parola a fost actualizata cu succes')
                return redirect('student_profile')  
        else:
            messages.error(request, 'Rectifica urmatoarele greseli.')

    form = PasswordChangeForm(request.user)
    
    return render(request, 'profile/change_password.html', {'form': form})


User = get_user_model()

def forgot_password(request):
    if request.user.is_authenticated:
        if request.method == 'POST':
            user = request.user
            
            if hasattr(user, 'teacher'):
                user_display_name = f"{user.teacher.name} {user.teacher.surname}"
                reset_password_url = reverse('teacher_reset_password', kwargs={
                    'uidb64': urlsafe_base64_encode(force_bytes(user.pk)),
                    'token': account_activation_token.make_token(user)
                })
                
            elif hasattr(user, 'student'):
                user_display_name = user.student.username
                reset_password_url = reverse('student_reset_password', kwargs={
                    'uidb64': urlsafe_base64_encode(force_bytes(user.pk)),
                    'token': account_activation_token.make_token(user)
                })
            else:
                messages.error(request, "Tip de utilizator nerecunoscut.")
                return redirect('home')
            
            mail_subject = 'Resetare parolă'
            message = render_to_string('profile/reset_password_email.html', {
                'user': user_display_name,
                'domain': get_current_site(request).domain,
                'reset_password_url': reset_password_url,
                'protocol': 'https' if request.is_secure() else 'http',
            })
            
            email = EmailMessage(mail_subject, message, to=[user.email])
            email.content_subtype = "html"
            
            try:
                email.send()
                messages.success(request, "Un link de resetare a parolei a fost trimis la adresa ta de email.")
            except Exception as e:
                messages.error(request, f"Trimiterea emailului a eșuat. Eroare: {str(e)}")
            
            if hasattr(user, 'teacher'):
                return redirect('teacher_profile')
            else:
                return redirect('student_profile')
        
        if hasattr(request.user, 'teacher'):
            return redirect('teacher_profile')
        else:
            return redirect('student_profile')
    
    else:
        if request.method == 'POST':
            email = request.POST.get('email')
            
            if not email:
                messages.error(request, "Te rugăm să introduci adresa de email.")
                return render(request, 'user/forgot_password_notlogged.html')
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                messages.success(request, "Dacă adresa de email există în baza de date, vei primi un link de resetare a parolei.")
                return render(request, 'user/forgot_password.html')
            
            if hasattr(user, 'teacher'):
                user_display_name = f"{user.teacher.name} {user.teacher.surname}"
                reset_password_url = reverse('teacher_reset_password', kwargs={
                    'uidb64': urlsafe_base64_encode(force_bytes(user.pk)),
                    'token': account_activation_token.make_token(user)
                })
            elif hasattr(user, 'student'):
                user_display_name = user.student.username
                reset_password_url = reverse('student_reset_password', kwargs={
                    'uidb64': urlsafe_base64_encode(force_bytes(user.pk)),
                    'token': account_activation_token.make_token(user)
                })
            else:
                messages.success(request, "Dacă adresa de email există în baza de date, vei primi un link de resetare a parolei.")
                return render(request, 'user/forgot_password.html')
            
            mail_subject = 'Resetare parolă'
            message = render_to_string('profile/reset_password_email.html', {
                'user': user_display_name,
                'domain': get_current_site(request).domain,
                'reset_password_url': reset_password_url,
                'protocol': 'https' if request.is_secure() else 'http',
            })
            
            email_message = EmailMessage(mail_subject, message, to=[email])
            email_message.content_subtype = "html"
            
            try:
                email_message.send()
            except Exception as e:
                print(f"Eroare la trimiterea emailului de resetare: {str(e)}")            
            return render(request, 'user/forgot_password.html')
        
        return render(request, 'user/forgot_password.html')


def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        if request.method == 'POST':
            new_password = request.POST.get('new_password')
            confirm_password = request.POST.get('confirm_password')

            if new_password == confirm_password:
                user.set_password(new_password)
                user.save()
                messages.success(request, "Parola a fost resetată cu succes.")

                return redirect('teacher_login' if hasattr(user, 'teacher') else 'student_login')
            else:
                messages.error(request, "Parolele nu se potrivesc. Încearcă din nou.")
        
        return render(request, 'profile/reset_password.html', {'valid_link': True})
    else:
        messages.error(request, "Link-ul este invalid sau a expirat.")
        return redirect('teacher_login' if hasattr(user, 'teacher') else 'student_login')


@login_required
def delete_account(request):
    if request.method == "POST":
        user = request.user
        user_type = 'teacher' if hasattr(user, 'teacher') else 'student'
        
        user.delete()
        logout(request)
        messages.success(request, "Contul a fost șters cu succes.")

        if user_type == 'teacher':
            return redirect('teacher_login')
        else:
            return redirect('student_login')

    return render(request, "profile/delete_account.html")


@login_required
def change_profile_photo(request):
    if request.method == 'POST' and 'profile_picture' in request.FILES:
        profile_picture = request.FILES['profile_picture']
        if hasattr(request.user, 'teacher'):
            user = Teacher.objects.get(id=request.user.id)
            redirect_url = 'teacher_profile'
        elif hasattr(request.user, 'student'):
            user = Student.objects.get(id=request.user.id)
            redirect_url = 'student_profile'
        else:
            messages.error(request, "User type not recognized.")
            return redirect('home')

        user.profile_picture = profile_picture
        user.save()

        messages.success(request, "Fotografia de profil a fost actualizata cu succes.")
        return redirect(redirect_url)

    return render(request, 'profile/change_pf.html')


def logout_previous_sessions(user):
    sessions = Session.objects.filter(expire_date__gte=now())
    for session in sessions:
        session_data = session.get_decoded()
        if session_data.get('_auth_user_id') == str(user.id):
            session.delete()


def terms(request):
    is_student = False
    if request.user.is_authenticated and hasattr(request.user, 'student'):
        is_student = True
        
    return render(request,'user/terms.html', { 'is_student': is_student})
    