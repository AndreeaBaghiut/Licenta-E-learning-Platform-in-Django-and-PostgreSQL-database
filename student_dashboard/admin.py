from django.contrib import admin
from .models import Enrollment, ProgressTracker, QuizResult, Certificate
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_on', 'progress', 'status', 'get_progress_bar')
    list_filter = ('status', 'course', 'enrolled_on')
    search_fields = ('student__username', 'student__email', 'course__name')
    readonly_fields = ('enrolled_on',)
    list_editable = ('status',)
    date_hierarchy = 'enrolled_on'
    
    def get_progress_bar(self, obj):
        percentage = float(obj.progress)
        color = 'green' if percentage >= 80 else 'orange' if percentage >= 50 else 'red'
        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0;">'
            '<div style="width: {}px; background-color: {}; height: 20px;"></div>'
            '</div>',
            int(percentage), color
        )
    get_progress_bar.short_description = 'Progress Bar'
    
    actions = ['mark_completed', 'reset_progress']
    
    def mark_completed(self, request, queryset):
        updated = queryset.update(status='completed', progress=100.00)
        self.message_user(request, f'{updated} înscriuri au fost marcate ca finalizate.')
    mark_completed.short_description = 'Marchează ca finalizate'
    
    def reset_progress(self, request, queryset):
        updated = queryset.update(progress=0.00, status='in_progress')
        self.message_user(request, f'Progresul pentru {updated} înscriuri a fost resetat.')
    reset_progress.short_description = 'Resetează progresul'


@admin.register(ProgressTracker)
class ProgressTrackerAdmin(admin.ModelAdmin):
    list_display = ('get_student', 'get_course', 'subchapter', 'is_completed', 'start_date', 'completion_date')
    list_filter = ('is_completed', 'enrollment__course', 'subchapter')  
    search_fields = ('enrollment__student__username', 'enrollment__course__name', 'subchapter__title')
    readonly_fields = ('start_date', 'completion_date')
    list_editable = ('is_completed',)
    
    def get_student(self, obj):
        return obj.enrollment.student.username
    get_student.short_description = 'Student'
    get_student.admin_order_field = 'enrollment__student__username'
    
    def get_course(self, obj):
        return obj.enrollment.course.name
    get_course.short_description = 'Curs'
    get_course.admin_order_field = 'enrollment__course__name'
    
    def get_subchapter_title(self, obj):
        return obj.subchapter.title  # Doar titlul subcapitolului
    get_subchapter_title.short_description = 'Subcapitol'
    get_subchapter_title.admin_order_field = 'subchapter__title'
    
    actions = ['mark_completed', 'mark_incomplete']
    
    def mark_completed(self, request, queryset):
        updated = queryset.update(is_completed=True, completion_date=timezone.now())
        self.message_user(request, f'{updated} subcapitole au fost marcate ca finalizate.')
    mark_completed.short_description = 'Marchează ca finalizate'
    
    def mark_incomplete(self, request, queryset):
        updated = queryset.update(is_completed=False, completion_date=None)
        self.message_user(request, f'{updated} subcapitole au fost marcate ca nefinalizate.')
    mark_incomplete.short_description = 'Marchează ca nefinalizate'


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ('get_student', 'get_course', 'get_question_preview', 'is_correct', 'is_completed', 'attempted_on')
    list_filter = ('is_correct', 'is_completed', 'progress__enrollment__course', 'attempted_on')
    search_fields = ('progress__enrollment__student__username', 'question__text', 'progress__enrollment__course__name')
    readonly_fields = ('attempted_on', 'start_time')
    list_editable = ('is_correct', 'is_completed')
    date_hierarchy = 'attempted_on'
    
    def get_student(self, obj):
        return obj.progress.enrollment.student.username
    get_student.short_description = 'Student'
    get_student.admin_order_field = 'progress__enrollment__student__username'
    
    def get_course(self, obj):
        return obj.progress.enrollment.course.name
    get_course.short_description = 'Curs'
    get_course.admin_order_field = 'progress__enrollment__course__name'
    
    def get_question_preview(self, obj):
        return obj.question.text[:50] + '...' if len(obj.question.text) > 50 else obj.question.text
    get_question_preview.short_description = 'Întrebare'
    
    actions = ['mark_correct', 'mark_incorrect']
    
    def mark_correct(self, request, queryset):
        updated = queryset.update(is_correct=True)
        self.message_user(request, f'{updated} răspunsuri au fost marcate ca corecte.')
    mark_correct.short_description = 'Marchează ca corecte'
    
    def mark_incorrect(self, request, queryset):
        updated = queryset.update(is_correct=False)
        self.message_user(request, f'{updated} răspunsuri au fost marcate ca incorecte.')
    mark_incorrect.short_description = 'Marchează ca incorecte'


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('get_student', 'get_course', 'status', 'issue_date', 'approver', 'get_verification_link')
    list_filter = ('status', 'issue_date', 'enrollment__course')
    search_fields = ('enrollment__student__username', 'enrollment__student__email', 'enrollment__course__name')
    readonly_fields = ('certificate_uuid', 'issue_date', 'action_date', 'get_verification_url')
    list_editable = ('status',)
    date_hierarchy = 'issue_date'
    
    fieldsets = (
        ('Informații Certificate', {
            'fields': ('certificate_uuid', 'enrollment', 'issue_date')
        }),
        ('Status și Aprobare', {
            'fields': ('status', 'approver', 'action_date')
        }),
        ('Link Verificare', {
            'fields': ('get_verification_url',)
        }),
    )
    
    def get_student(self, obj):
        return obj.enrollment.student.username
    get_student.short_description = 'Student'
    get_student.admin_order_field = 'enrollment__student__username'
    
    def get_course(self, obj):
        return obj.enrollment.course.name
    get_course.short_description = 'Curs'
    get_course.admin_order_field = 'enrollment__course__name'
    
    def get_verification_link(self, obj):
        if obj.certificate_uuid:
            url = obj.get_verification_url()
            return format_html('<a href="{}" target="_blank">Verifică certificatul</a>', url)
        return '-'
    get_verification_link.short_description = 'Link Verificare'
    
    def get_verification_url(self, obj):
        return obj.get_verification_url() if obj.certificate_uuid else '-'
    get_verification_url.short_description = 'URL Verificare'
    
    actions = ['approve_certificates', 'reject_certificates', 'reset_to_pending']
    
    def approve_certificates(self, request, queryset):
        updated = queryset.filter(status='pending').update(
            status='approved', 
            approver=request.user,
            action_date=timezone.now()
        )
        self.message_user(request, f'{updated} certificate au fost aprobate.')
    approve_certificates.short_description = 'Aprobă certificatele'
    
    def reject_certificates(self, request, queryset):
        updated = queryset.filter(status='pending').update(
            status='rejected',
            approver=request.user,
            action_date=timezone.now()
        )
        self.message_user(request, f'{updated} certificate au fost respinse.')
    reject_certificates.short_description = 'Respinge certificatele'
    
    def reset_to_pending(self, request, queryset):
        updated = queryset.update(status='pending', approver=None, action_date=None)
        self.message_user(request, f'{updated} certificate au fost resetate la status pending.')
    reset_to_pending.short_description = 'Resetează la pending'