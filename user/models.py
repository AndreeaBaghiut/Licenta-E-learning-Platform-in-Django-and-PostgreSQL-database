from django.db import models
from django.contrib.auth.models import (AbstractBaseUser, BaseUserManager, PermissionsMixin)
#from django_countries.fields import CountryField
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, is_staff, is_superuser, **extra_fields):
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, is_staff=is_staff, is_superuser=is_superuser, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        return self._create_user(email, password, False, False, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        return self._create_user(email, password, True, True, **extra_fields)


class FrontUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, verbose_name=_('email address'), unique=True, db_index=True,
                              error_messages={'unique': _('Un utilizator este deja înregistrat cu această adresă de email.')})
    is_active = models.BooleanField(default=True,
                                    help_text=_('Designates whether this user should be treated as active.'
                                                ' Unselect this instead of deleting accounts.'))
    is_staff = models.BooleanField(default=False,
                                   help_text=_('Designates whether the user can log into this admin site.'))
    date_joined = models.DateTimeField(verbose_name=_('date joined'), default=timezone.now)

    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, default='profile_pictures/poza.jpeg')

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def get_full_name(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True


class Student(FrontUser):
    username = models.CharField(max_length=30, unique=True)
    #country = CountryField()
    OCCUPATION_CHOICES = [
        ('student', 'Student'),
        ('employed', 'Angajat'),
        ('unemployed', 'Șomer'),
        ('self_employed', 'Liber profesionist/PFA'),
        ('freelancer', 'Freelancer'),
        ('retired', 'Pensionar'),
        ('others', 'Altele'),
    ]
    occupation = models.CharField(max_length=30, choices=OCCUPATION_CHOICES, default='others')
    IT_LEVEL_CHOICES = [
        ('just_started', 'Abia am început (nou în IT)'),
        ('beginner', 'Începător'),
        ('intermediate', 'Intermediar'),
        ('advanced', 'Avansat'),
    ]   
    it_level = models.CharField(max_length=30, choices=IT_LEVEL_CHOICES, default='just_started')

    @property
    def is_student(self):
        return True

    class Meta:
        verbose_name = _('Student')
        verbose_name_plural = _('Students')

    def __str__(self):
        return self.username


class ExpertiseArea(models.Model):
    WEB_DEV = 'web_dev'
    MOBILE_DEV = 'mobile_dev'
    DATA_SCIENCE = 'data_science'
    CYBER_SECURITY = 'cyber_security'
    NETWORKING = 'networking'
    CLOUD_COMPUTING = 'cloud_computing'
    ARTIFICIAL_INTELLIGENCE = 'artificial_intelligence'
    MACHINE_LEARNING = 'machine_learning'
    BLOCKCHAIN = 'blockchain'
    GAME_DEV = 'game_dev'
    UI_UX_DESIGN = 'ui_ux_design'
    EMBEDDED_SYSTEMS = 'embedded_systems'
    IT_MANAGEMENT = 'it_management'
    SOFTWARE_TESTING = 'software_testing'

    EXPERTISE_CHOICES = [
        (WEB_DEV, 'Web Development'),
        (MOBILE_DEV, 'Mobile App Development'),
        (DATA_SCIENCE, 'Data Science'),
        (CYBER_SECURITY, 'Cybersecurity'),
        (NETWORKING, 'Networking'),
        (CLOUD_COMPUTING, 'Cloud Computing'),
        (ARTIFICIAL_INTELLIGENCE, 'Artificial Intelligence'),
        (MACHINE_LEARNING, 'Machine Learning'),
        (GAME_DEV, 'Game Development'),
        (UI_UX_DESIGN, 'UI/UX Design'),
        (EMBEDDED_SYSTEMS, 'Embedded Systems'),
        (IT_MANAGEMENT, 'IT Management'),
        (SOFTWARE_TESTING, 'Software Testing'),
    ]

    name = models.CharField(max_length=30, choices=EXPERTISE_CHOICES)

    def __str__(self):
        return dict(self.EXPERTISE_CHOICES).get(self.name, self.name)

    class Meta:
        verbose_name_plural = "Expertise areas"


class Teacher(FrontUser):
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=35)
    expertise_area = models.ManyToManyField(ExpertiseArea, blank=True)
    ACADEMIC_TITLE_CHOICES = [
        ('professor', 'Profesor'),
        ('graduate_student', 'Student masterand/doctorand'),
        ('professional', 'Profesionist în domeniu'),
        ('other', 'Altele'),
    ]   
    academic_title = models.CharField(max_length=20, choices=ACADEMIC_TITLE_CHOICES, default='other')
    activity_years = models.IntegerField(default=0)
    resume = models.FileField(upload_to='resumes/', blank=True)
    STATUS_CHOICES = [
        ('pending', 'În așteptare'),
        ('approved', 'Aprobat'),
        ('rejected', 'Respins'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    @property
    def is_teacher(self):
        return True

    class Meta:
        verbose_name = _('Teacher')
        verbose_name_plural = _('Teachers')

    def __str__(self):
        return f"{self.name} {self.surname}"
