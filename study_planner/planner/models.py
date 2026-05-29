from django.db import models
from django.contrib.auth.models import User


PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
]


STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('completed', 'Completed'),
]


class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    subject = models.CharField(max_length=100)
    task_title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.task_title} ({self.user.username})"
