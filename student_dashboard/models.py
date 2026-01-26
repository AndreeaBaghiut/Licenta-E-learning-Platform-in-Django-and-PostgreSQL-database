from django.db import models
from teacher_dashboard.models import Course, Subcapitol, Question
from user.models import Student
from django.utils import timezone
import uuid
from django.urls import reverse
from django.conf import settings

class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_on = models.DateTimeField(default=timezone.now)
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0.00,
                                   help_text='The complete percentage of the course.')
    status = models.CharField(max_length=20, choices=[('in_progress', 'In progress'), ('completed', 'Completed')],
                              default='in_progress')

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.name}"


class ProgressTracker(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='progress_trackers')
    subchapter = models.ForeignKey(Subcapitol, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    start_date = models.DateTimeField(null=True, blank=True)
    completion_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('enrollment', 'subchapter')  # asigura unicitatea progresului per inscriere-subcapitol
        ordering = ['subchapter__position']

    def __str__(self):
        return f"Progress of {self.enrollment.student.username} on {self.subchapter.title}"


class QuizResult(models.Model):
    progress = models.ForeignKey(ProgressTracker, on_delete=models.CASCADE, related_name='quiz_results')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    is_correct = models.BooleanField(default=False)
    start_time = models.DateTimeField(null=True, blank=True)
    attempted_on = models.DateTimeField(default=timezone.now)
    is_completed = models.BooleanField(default=False) 

    def __str__(self):
        return f"Quiz result for {self.progress.enrollment.student.username} on {self.question.text[:50]}: {'Correct' if self.is_correct else 'Incorrect'}"
    

class Certificate(models.Model):
    STATUS_CHOICES = (
        ('pending', 'În așteptare'),
        ('approved', 'Aprobat'),
        ('rejected', 'Respins')
    )
    
    certificate_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    enrollment = models.OneToOneField('Enrollment', on_delete=models.CASCADE, related_name='certificate')
    issue_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_certificates')
    action_date = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.pk:
            old_instance = Certificate.objects.get(pk=self.pk)
            if old_instance.status == 'pending' and self.status != 'pending':
                self.action_date = timezone.now()
        super().save(*args, **kwargs)
    
    def get_verification_url(self):
        return reverse('verify_certificate', args=[str(self.certificate_uuid)])
    
    def __str__(self):
        return f"Certificate for {self.enrollment.student.username} - {self.enrollment.course.name}"
# Create your models here.
