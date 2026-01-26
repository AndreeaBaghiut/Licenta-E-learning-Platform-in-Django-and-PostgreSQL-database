from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import ExpertiseArea, Student, Teacher, FrontUser
from django.core.mail import send_mail
from django.conf import settings


def send_approval_email(teacher):
    send_mail(
        'Cont aprobat',
        'Contul tau a fost aprobat. Acum te poti loga in acesta.',
        settings.DEFAULT_FROM_EMAIL,
        [teacher.email],
        fail_silently=False,
    )


def send_rejection_email(teacher):
    send_mail(
        'Cont respins',
        'Cererea ta de inregistare a fost respinsa.',
        settings.DEFAULT_FROM_EMAIL,
        [teacher.email],
        fail_silently=False,
    )


@admin.register(FrontUser)
class FrontUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('email',)
    readonly_fields = ('date_joined',)
    ordering = ('-date_joined',)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'occupation', 'it_level', 'is_active', 'date_joined')
    list_filter = ('occupation', 'it_level', 'is_active', 'date_joined')
    search_fields = ('username', 'email')
    readonly_fields = ('date_joined',)
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Informații Cont', {
            'fields': ('email', 'username', 'profile_picture')
        }),
        ('Informații Personale', {
            'fields': ('occupation', 'it_level')
        }),
        ('Permisiuni', {
            'fields': ('is_active', 'is_staff')
        }),
        ('Date Importante', {
            'fields': ('date_joined',)
        }),
    )
    
    actions = ['activate_students', 'deactivate_students']
    
    def activate_students(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} studenți au fost activați.')
    activate_students.short_description = 'Activează studenții selectați'
    
    def deactivate_students(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} studenți au fost dezactivați.')
    deactivate_students.short_description = 'Dezactivează studenții selectați'


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'email', 'status', 'academic_title', 'activity_years', 'get_expertise_areas', 'get_resume_link', 'date_joined')
    list_filter = ('status', 'academic_title', 'activity_years', 'date_joined', 'expertise_area')
    search_fields = ('name', 'surname', 'email')
    list_editable = ('status',)
    filter_horizontal = ('expertise_area',)
    date_hierarchy = 'date_joined'
    
    fieldsets = (
        ('Informații Cont', {
            'fields': ('email', 'profile_picture', 'is_active', 'is_staff')
        }),
        ('Informații Personale', {
            'fields': ('name', 'surname', 'academic_title', 'activity_years')
        }),
        ('Expertiză și CV', {
            'fields': ('expertise_area', 'resume')
        }),
        ('Status Aprobare', {
            'fields': ('status',)
        }),
        ('Date Importante', {
            'fields': ('date_joined',)
        }),
    )
    
    readonly_fields = ('date_joined',)
    
    def get_full_name(self, obj):
        return f"{obj.name} {obj.surname}"
    get_full_name.short_description = 'Nume Complet'
    get_full_name.admin_order_field = 'name'
    
    def get_expertise_areas(self, obj):
        areas = obj.expertise_area.all()[:3]  # Primul 3 pentru spațiu
        return ", ".join([str(area) for area in areas]) + ("..." if obj.expertise_area.count() > 3 else "")
    get_expertise_areas.short_description = 'Domenii Expertiză'
    
    def get_resume_link(self, obj):
        if obj.resume:
            return format_html('<a href="{}" target="_blank">Descarcă CV</a>', obj.resume.url)
        return 'Nu există CV'
    get_resume_link.short_description = 'CV'
    
    actions = ['approve_teachers', 'reject_teachers', 'reset_to_pending']
    
    def approve_teachers(self, request, queryset):
        approved_count = 0
        for teacher in queryset.filter(status='pending'):
            teacher.status = 'approved'
            teacher.is_active = True
            teacher.save()
            send_approval_email(teacher)
            approved_count += 1
        self.message_user(request, f'{approved_count} profesori au fost aprobați și notificați prin email.')
    approve_teachers.short_description = 'Aprobă profesorii selectați'
    
    def reject_teachers(self, request, queryset):
        rejected_count = 0
        for teacher in queryset.filter(status='pending'):
            teacher.status = 'rejected'
            teacher.save()
            send_rejection_email(teacher)
            rejected_count += 1
        self.message_user(request, f'{rejected_count} profesori au fost respinși și notificați prin email.')
    reject_teachers.short_description = 'Respinge profesorii selectați'
    
    def reset_to_pending(self, request, queryset):
        updated = queryset.update(status='pending')
        self.message_user(request, f'{updated} profesori au fost resetați la status pending.')
    reset_to_pending.short_description = 'Resetează la status pending'
    
    def save_model(self, request, obj, form, change):
        if change:  # doar când se actualizează un obiect existent
            previous_teacher = Teacher.objects.get(pk=obj.pk)
            previous_status = previous_teacher.status
            new_status = form.cleaned_data.get('status')

            super().save_model(request, obj, form, change)

            if previous_status != new_status:
                if new_status == 'approved':
                    obj.is_active = True
                    obj.save()
                    send_approval_email(obj)
                elif new_status == 'rejected':
                    send_rejection_email(obj)
        else:
            super().save_model(request, obj, form, change)


@admin.register(ExpertiseArea)
class ExpertiseAreaAdmin(admin.ModelAdmin):
    list_display = ('get_display_name', 'name')
    search_fields = ('name',)
    
    def get_display_name(self, obj):
        return str(obj)  # Folosește __str__ method-ul
    get_display_name.short_description = 'Nume Afișat'