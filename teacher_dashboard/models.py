from django.db import models
from django.db.models import JSONField
#from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from user.models import Teacher


class Category(models.Model):
    CATEGORY_TYPES = (
        ('language', 'Language'),
        ('general', 'General'),
    )

    name = models.CharField(max_length=100, unique=True)
    category_type = models.CharField(max_length=50, choices=CATEGORY_TYPES, default='general')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"


class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='courses')
    is_published = models.BooleanField(default=False, verbose_name="Published")
    course_image = models.ImageField(upload_to='courses_images/', blank=True, default='courses_images/img.jpeg')
    categories = models.ManyToManyField(Category, related_name='courses')
    is_finished = models.BooleanField(default=False, verbose_name="Finished")

    def __str__(self):
        return self.name

    def get_total_subchapters(self):
        return self.chapters.count() + sum(chapter.subchapter.count() for chapter in self.chapters.all())


class Capitol(models.Model):
    title = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chapters')
    is_published = models.BooleanField(default=False, verbose_name="Published")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position']

    def __str__(self):
        return f"{self.title} - {self.course.name}"


class Subcapitol(models.Model):
    title = models.CharField(max_length=255)
    chapter = models.ForeignKey(Capitol, on_delete=models.CASCADE, related_name='subchapters')
    content = models.TextField(blank=True)
    is_published = models.BooleanField(default=False, verbose_name="Published")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position'] 

    def __str__(self):
        return f"{self.title} - {self.chapter.title}"


class Quizz(models.Model):
    subchapter = models.ForeignKey(Subcapitol, on_delete=models.CASCADE, related_name='quizzes', default=1)
    title = models.CharField(max_length=100, default='Q1')
    is_published = models.BooleanField(default=False, verbose_name="Published")

    def __str__(self):
        return f"Quizz for subchapter: {self.subchapter.title}"


class Question(models.Model):
    quizz = models.ForeignKey(Quizz, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)

    def __str__(self):
        # nr intrebarii in functie de ordinea sa in quizz
        question_number = self.quizz.questions.filter(id__lte=self.id).count()
        return "Qself.question_number}"


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return "Answer: {self.text} {'Correct' if self.is_correct else ''}"


class Exercise(models.Model):
    
    PROGRAMMING_LANGUAGES = [
        ('Python', 'Python'),
        #('JavaScript', 'JavaScript'),
        ('Java', 'Java'),
        #('C++', 'C++'),
        #('C', 'C'),
        ('PHP', 'PHP'),
    ]
      
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='exercises')
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    programming_language = models.CharField(
        max_length=50, 
        choices=PROGRAMMING_LANGUAGES, 
        default='Python',
        help_text="Limbajul de programare folosit pentru acest exercitiu.",
        
    )
    reference_solution = models.TextField(
        help_text="Codul soluției de referință pentru acest exercițiu.", 
        blank=True, 
        null=True
    )
    
    class Meta:
        abstract = True

    def __str__(self):
        return self.title


class CourseExercise(Exercise):
    subchapter = models.ForeignKey(Subcapitol, on_delete=models.CASCADE, related_name='exercises')
    position = models.PositiveIntegerField(default=0)
    #created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='course_exercises')

    class Meta:
        ordering = ['position']

    def __str__(self):
        return f"{self.title} (Subchapter: {self.subchapter.title})"


class IndependentExercise(Exercise):
    DIFFICULTY_LEVELS = [
        ('beginner', 'Beginner'),
        ('medium', 'Medium'),
        ('advanced', 'Advanced'),
    ]

    difficulty = models.CharField(
        max_length=50, 
        choices=DIFFICULTY_LEVELS, 
        default='beginner'
    )

    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='independent_exercises')

    def __str__(self):
        return f"{self.title} (Independent)"


class TestCase(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    exercise = models.ForeignKey(IndependentExercise, on_delete=models.CASCADE, related_name='test_cases', default='1')
    
    input_data = models.JSONField(help_text="Input-ul pentru test (ex: 2 3).")
    expected_output = models.JSONField(help_text="Output-ul așteptat pentru acest input.")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TestCase for {self.exercise}: Input: {self.input_data}, Expected: {self.expected_output}"
    
    

#class TeacherTestCase(models.Model):
 #   test_case = models.ForeignKey(TestCase, on_delete=models.CASCADE, related_name='teacher_test_cases', default='1')
  #  exercise = models.ForeignKey(IndependentExercise, on_delete=models.CASCADE, related_name='teacher_test_cases')
   # passed = models.BooleanField(default=False, help_text="Indica dacă testul a fost trecut.")

    #def __str__(self):
     #   return f"TeacherTestCase for {self.exercise.title}: Passed: {self.passed}"


class InterviewQuestion(models.Model):
    question = models.TextField(verbose_name="Întrebare interviu")
    answer = models.TextField(verbose_name="Model de răspuns")
    categories = models.ManyToManyField(Category, related_name="questions")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='interview_questions')
    is_published = models.BooleanField(default=False)

    
    def __str__(self):
        return self.question[:50]
    
    class Meta:
        verbose_name_plural = "Întrebări interviu"