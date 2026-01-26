from django import forms
from django.contrib.auth.forms import PasswordChangeForm

from .models import Course, Capitol, Subcapitol, Quizz, CourseExercise, IndependentExercise, TestCase, InterviewQuestion
from django import forms
from django.forms import modelformset_factory
#import json



class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['name', 'description', 'course_image']


class CapitolForm(forms.ModelForm):
    class Meta:
        model = Capitol
        fields = ['title', 'course']


class SubcapitolForm(forms.ModelForm):
    class Meta:
        model = Subcapitol
        fields = ['title', 'chapter', 'content']


class QuizzForm(forms.ModelForm):
    class Meta:
        model = Quizz
        fields = ['subchapter']


class CourseExerciseForm(forms.ModelForm):
    class Meta:
        model = CourseExercise
        fields = ['title', 'description', 'subchapter', 'position', 'is_published']

class IndependentExerciseForm(forms.ModelForm):
    class Meta:
        model = IndependentExercise
        fields = ['title', 'description', 'programming_language', 'difficulty', 'reference_solution']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3,
                                                 'placeholder': 'Please enter a description...',}),
            'reference_solution': forms.Textarea(attrs={'rows': 12}), 
            }

class TestCaseForm(forms.ModelForm):
    class Meta:
        model = TestCase
        fields = ['input_data', 'expected_output']
        widgets = {
            'input_data': forms.Textarea(attrs={'rows': 2}),
            'expected_output': forms.Textarea(attrs={'rows': 2}),
        }
    

# creeaza un set de formulare pe baza modelului TestCase utlizand TestCaseForm, nr de formulare va fi gestionat in bk-end
TestCaseFormSet = modelformset_factory(
    TestCase, # bd
    form=TestCaseForm, 
    extra=0,
)

# creeaza un formset care contine toate test case-urile existente
# acesta va fi gol la inceput si va incarca test case-uri existente
test_case_formset = TestCaseFormSet(queryset=TestCase.objects.none())



class ChangePasswordForm(PasswordChangeForm):
    old_password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Old Password'}))
    new_password1 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'New Password'}))
    new_password2 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Confirm New Password'}))
    
    

class InterviewQuestionForm(forms.ModelForm):
    class Meta:
        model = InterviewQuestion
        fields = ['question', 'answer']#, 'category']
        widgets = {
            'question': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Introduceți întrebarea pentru interviul de angajare'}),
            'answer': forms.Textarea(attrs={'rows': 6, 'placeholder': 'Introduceți un model de răspuns așteptat'}),
        }
        labels = {
            'question': 'Întrebare',
            'answer': 'Model de răspuns',
            #'category': 'Categorie'
        }