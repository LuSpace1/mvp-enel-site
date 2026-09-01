import uuid

from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class CustomUserManager(UserManager):
    def _create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("El nombre de usuario es obligatorio.")
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("El administrador debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El administrador debe tener is_superuser=True.")
        return self._create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    objects = CustomUserManager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(
        max_length=150,
        unique=True,
        db_index=True,
        help_text="Identificador del trabajador o nombre de usuario del administrador.",
    )
    is_platform_admin = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Indica si la persona puede entrar al panel de administración.",
    )

    first_name = None
    last_name = None
    email = None

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{'Admin: ' if self.is_platform_admin else 'User: '}{self.username}"

    def get_full_name(self):
        return self.username
