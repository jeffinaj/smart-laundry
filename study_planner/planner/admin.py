from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'task_title', 'user', 'subject', 'deadline', 'priority', 'status', 'created_at')
    list_filter = ('priority', 'status', 'subject')
    search_fields = ('task_title', 'description')
