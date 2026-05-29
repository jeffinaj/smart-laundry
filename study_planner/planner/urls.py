from django.urls import path
from . import views

app_name = 'planner'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('tasks/', views.task_list, name='task_list'),
    path('tasks/add/', views.task_create, name='task_create'),
    path('tasks/<int:pk>/edit/', views.task_edit, name='task_edit'),
    path('tasks/<int:pk>/delete/', views.task_delete, name='task_delete'),
    path('tasks/<int:pk>/toggle/', views.task_toggle, name='task_toggle'),

    # API endpoints for AJAX
    path('api/tasks/', views.tasks_json, name='tasks_json'),
    path('api/search/', views.search_tasks, name='search_tasks'),
]
