from django.contrib.auth import authenticate
from django.contrib.auth.forms import UserCreationForm
from django import forms
from .models import Student, Teacher, ExpertiseArea
from django_recaptcha.fields import ReCaptchaField
#from captcha.fields import CaptchaField
from django.contrib.auth.forms import PasswordChangeForm

class StudentRegistrationForm(forms.ModelForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control'}), label='Username')
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control'}), label='Email')
    password1 = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}), label='Parolă')
    password2 = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}), label='Confirmă parola')
    #country = forms.TypedChoiceField(label='Țară')
    occupation = forms.ChoiceField(choices=Student.OCCUPATION_CHOICES, label='Ocupație')
    it_level = forms.ChoiceField(choices=Student.IT_LEVEL_CHOICES, label='Nivel de cunoștințe IT')


    class Meta:
        model = Student
        fields = ['username', 'email', 'password1', 'password2', 'occupation', 'it_level']
        labels = {
            'country': 'Țară',  
        }

    def clean(self):
        cleaned_data = super(StudentRegistrationForm, self).clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")

        return cleaned_data

    def save(self, commit=True):
        user = super(StudentRegistrationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class TeacherRegistrationForm(UserCreationForm):
    email = forms.EmailField(widget=forms.TextInput(
        attrs={'class': 'form-control', 'type': 'text', 'name': 'email'}),
        label='Email')
    name = forms.CharField(max_length=25, label='Nume')
    surname = forms.CharField(max_length=35, label='Prenume')
    password1 = forms.CharField(widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'type': 'password', 'name': 'password1'}),
        label='Parolă')

    password2 = forms.CharField(widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'type': 'password', 'name': 'password2'}),
        label='Confirmă parola')
    expertise_area = forms.ModelMultipleChoiceField(queryset=ExpertiseArea.objects.all(),
                                                    widget=forms.CheckboxSelectMultiple, required=True, label='Domeniu de expertiză')
    academic_title = forms.ChoiceField(choices=Teacher.ACADEMIC_TITLE_CHOICES, label='Titlu academic')
    activity_years = forms.ChoiceField(label='Ani de activitate', choices=[(i, i) for i in range(1, 51)])
    resume = forms.FileField(label='CV',required=True)

    # recaptcha = ReCaptchaField()

    class Meta:
        model = Teacher
        fields = ['email', 'name', 'surname', 'password1', 'password2', 'expertise_area', 'academic_title',
                  'activity_years', 'resume']  # , 'captcha']
        field_order = ['email', 'name', 'surname', 'password1', 'password2', 'expertise_area', 'academic_title',
                       'activity_years', 'resume']  # , 'captcha']

    def clean(self):
        cleaned_data = super(TeacherRegistrationForm, self).clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Parolele nu se potrivesc. Încearcă din nou.")

        return cleaned_data

    def save(self, commit=True):
        user = super(TeacherRegistrationForm, self).save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class StudentLoginForm(forms.Form):
    email = forms.EmailField(label='Email')
    password = forms.CharField(widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'type': 'password', 'name': 'password', 'placeholder': 'Parolă'}),
        label='Parolă')

    def clean(self):
        cleaned_data = super(StudentLoginForm, self).clean()
        email = cleaned_data.get('email')
        password = cleaned_data.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise forms.ValidationError('Email sau parolă invalide.')
        return cleaned_data


class TeacherLoginForm(forms.Form):
    email = forms.EmailField(label='Email')
    password = forms.CharField(widget=forms.PasswordInput(
        attrs={'class': 'form-control', 'type': 'password', 'name': 'password', 'placeholder': 'Parolă'}),
        label='Parolă')

    def clean(self):
        cleaned_data = super(TeacherLoginForm, self).clean()
        email = cleaned_data.get('email')
        password = cleaned_data.get('password')

        user = authenticate(email=email, password=password)
        if not user:
            raise forms.ValidationError('Email sau parolă invalide.')
        return cleaned_data

class ChangePasswordForm(PasswordChangeForm):
    old_password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Vechea parolă'}))
    new_password1 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Parolă noua'}))
    new_password2 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Confirmă parola nouă'}))


