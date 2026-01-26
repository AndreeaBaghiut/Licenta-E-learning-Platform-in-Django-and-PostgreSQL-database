from django.contrib import admin
from .models import (Category, Course, Capitol, Subcapitol, Quizz, Question, Answer, 
                     CourseExercise, IndependentExercise, TestCase, InterviewQuestion)
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'get_courses_count')
    list_filter = ('category_type',)
    search_fields = ('name',)
    
    def get_courses_count(self, obj):
        return obj.courses.count()
    get_courses_count.short_description = 'Nr. Cursuri'


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'is_published', 'is_finished', 'get_categories', 'get_chapters_count')
    list_filter = ('is_published', 'is_finished', 'categories', 'teacher')
    search_fields = ('name', 'description', 'teacher__username')
    list_editable = ('is_published', 'is_finished')
    filter_horizontal = ('categories',)
    
    fieldsets = (
        ('Informații Curs', {
            'fields': ('name', 'description', 'teacher')
        }),
        ('Media și Categorii', {
            'fields': ('course_image', 'categories')
        }),
        ('Status', {
            'fields': ('is_published', 'is_finished')
        }),
    )
    
    def get_categories(self, obj):
        return ", ".join([cat.name for cat in obj.categories.all()[:3]])
    get_categories.short_description = 'Categorii'
    
    def get_chapters_count(self, obj):
        return obj.chapters.count()
    get_chapters_count.short_description = 'Nr. Capitole'
    
    actions = ['publish_courses', 'unpublish_courses', 'mark_finished']
    
    def publish_courses(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} cursuri au fost publicate.')
    publish_courses.short_description = 'Publică cursurile'
    
    def unpublish_courses(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} cursuri au fost depublicate.')
    unpublish_courses.short_description = 'Depublică cursurile'
    
    def mark_finished(self, request, queryset):
        updated = queryset.update(is_finished=True)
        self.message_user(request, f'{updated} cursuri au fost marcate ca finalizate.')
    mark_finished.short_description = 'Marchează ca finalizate'


@admin.register(Capitol)
class CapitolAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'is_published', 'position', 'get_subchapters_count')
    list_filter = ('is_published', 'course')
    search_fields = ('title', 'course__name')
    list_editable = ('is_published', 'position')
    ordering = ('course', 'position')
    
    def get_subchapters_count(self, obj):
        return obj.subchapters.count()
    get_subchapters_count.short_description = 'Nr. Subcapitole'
    
    actions = ['publish_chapters', 'unpublish_chapters']
    
    def publish_chapters(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} capitole au fost publicate.')
    publish_chapters.short_description = 'Publică capitolele'
    
    def unpublish_chapters(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} capitole au fost depublicate.')
    unpublish_chapters.short_description = 'Depublică capitolele'


@admin.register(Subcapitol)
class SubcapitolAdmin(admin.ModelAdmin):
    list_display = ('title', 'get_chapter', 'get_course', 'is_published', 'position', 'get_content_preview')
    list_filter = ('is_published', 'chapter__course', 'chapter')
    search_fields = ('title', 'content', 'chapter__title', 'chapter__course__name')
    list_editable = ('is_published', 'position')
    ordering = ('chapter__course', 'chapter__position', 'position')
    
    def get_chapter(self, obj):
        return obj.chapter.title
    get_chapter.short_description = 'Capitol'
    get_chapter.admin_order_field = 'chapter__title'
    
    def get_course(self, obj):
        return obj.chapter.course.name
    get_course.short_description = 'Curs'
    get_course.admin_order_field = 'chapter__course__name'
    
    def get_content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    get_content_preview.short_description = 'Preview Conținut'


@admin.register(Quizz)
class QuizzAdmin(admin.ModelAdmin):
    list_display = ('title', 'get_subchapter', 'get_course', 'is_published', 'get_questions_count')
    list_filter = ('is_published', 'subchapter__chapter__course')
    search_fields = ('title', 'subchapter__title', 'subchapter__chapter__course__name')
    list_editable = ('is_published',)
    
    def get_subchapter(self, obj):
        return obj.subchapter.title
    get_subchapter.short_description = 'Subcapitol'
    
    def get_course(self, obj):
        return obj.subchapter.chapter.course.name
    get_course.short_description = 'Curs'
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    get_questions_count.short_description = 'Nr. Întrebări'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('get_text_preview', 'quizz', 'get_course', 'get_answers_count', 'get_correct_answers_count')
    list_filter = ('quizz__subchapter__chapter__course', 'quizz')
    search_fields = ('text', 'quizz__title', 'quizz__subchapter__title')
    
    def get_text_preview(self, obj):
        return obj.text[:100] + '...' if len(obj.text) > 100 else obj.text
    get_text_preview.short_description = 'Întrebare'
    
    def get_course(self, obj):
        return obj.quizz.subchapter.chapter.course.name
    get_course.short_description = 'Curs'
    
    def get_answers_count(self, obj):
        return obj.answers.count()
    get_answers_count.short_description = 'Nr. Răspunsuri'
    
    def get_correct_answers_count(self, obj):
        return obj.answers.filter(is_correct=True).count()
    get_correct_answers_count.short_description = 'Răspunsuri Corecte'


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('get_text_preview', 'get_question_preview', 'is_correct', 'get_course')
    list_filter = ('is_correct', 'question__quizz__subchapter__chapter__course')
    search_fields = ('text', 'question__text')
    list_editable = ('is_correct',)
    
    def get_text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    get_text_preview.short_description = 'Răspuns'
    
    def get_question_preview(self, obj):
        return obj.question.text[:50] + '...' if len(obj.question.text) > 50 else obj.question.text
    get_question_preview.short_description = 'Întrebare'
    
    def get_course(self, obj):
        return obj.question.quizz.subchapter.chapter.course.name
    get_course.short_description = 'Curs'


@admin.register(IndependentExercise)
class IndependentExerciseAdmin(admin.ModelAdmin):
    list_display = ('title', 'programming_language', 'difficulty', 'is_published', 'created_by', 'created_at')
    list_filter = ('programming_language', 'difficulty', 'is_published', 'created_by', 'created_at')
    search_fields = ('title', 'description', 'created_by__username')
    list_editable = ('is_published', 'difficulty')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informații Exercițiu', {
            'fields': ('title', 'description', 'difficulty')
        }),
        ('Cod și Limbaj', {
            'fields': ('programming_language', 'reference_solution')
        }),
        ('Status și Autor', {
            'fields': ('is_published', 'created_by')
        }),
    )
    
    actions = ['publish_exercises', 'unpublish_exercises']
    
    def publish_exercises(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} exerciții au fost publicate.')
    publish_exercises.short_description = 'Publică exercițiile'
    
    def unpublish_exercises(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} exerciții au fost depublicate.')
    unpublish_exercises.short_description = 'Depublică exercițiile'


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ('get_exercise', 'get_input_preview', 'get_output_preview', 'created_at')
    list_filter = ('exercise__programming_language', 'exercise__difficulty', 'created_at')
    search_fields = ('exercise__title', 'input_data', 'expected_output')
    date_hierarchy = 'created_at'
    
    def get_exercise(self, obj):
        return obj.exercise.title
    get_exercise.short_description = 'Exercițiu'
    get_exercise.admin_order_field = 'exercise__title'
    
    def get_input_preview(self, obj):
        return str(obj.input_data)[:50] + '...' if len(str(obj.input_data)) > 50 else str(obj.input_data)
    get_input_preview.short_description = 'Input'
    
    def get_output_preview(self, obj):
        return str(obj.expected_output)[:50] + '...' if len(str(obj.expected_output)) > 50 else str(obj.expected_output)
    get_output_preview.short_description = 'Output Așteptat'


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('get_question_preview', 'get_categories', 'created_by', 'is_published', 'created_at')
    list_filter = ('is_published', 'categories', 'created_by', 'created_at')
    search_fields = ('question', 'answer', 'created_by__username')
    list_editable = ('is_published',)
    filter_horizontal = ('categories',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Conținut Întrebare', {
            'fields': ('question', 'answer', 'categories')
        }),
        ('Status și Autor', {
            'fields': ('is_published', 'created_by')
        }),
    )
    
    def get_question_preview(self, obj):
        return obj.question[:100] + '...' if len(obj.question) > 100 else obj.question
    get_question_preview.short_description = 'Întrebare'
    
    def get_categories(self, obj):
        return ", ".join([cat.name for cat in obj.categories.all()[:3]])
    get_categories.short_description = 'Categorii'
    
    actions = ['publish_questions', 'unpublish_questions']
    
    def publish_questions(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} întrebări au fost publicate.')
    publish_questions.short_description = 'Publică întrebările'
    
    def unpublish_questions(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} întrebări au fost depublicate.')
    unpublish_questions.short_description = 'Depublică întrebările'