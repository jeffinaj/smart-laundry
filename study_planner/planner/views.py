from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Count, Q
from .forms import UserRegistrationForm, TaskForm
from .models import Task
from django.utils import timezone


def register_view(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('planner:dashboard')
    else:
        form = UserRegistrationForm()
    return render(request, 'planner/register.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('planner:dashboard')
        else:
            messages.error(request, 'Invalid credentials')
    return render(request, 'planner/login.html')


def logout_view(request):
    logout(request)
    return redirect('planner:login')


@login_required
def dashboard(request):
    user = request.user
    tasks = Task.objects.filter(user=user)
    total_tasks = tasks.count()
    completed_count = tasks.filter(status='completed').count()
    upcoming = tasks.filter(deadline__gte=timezone.now()).order_by('deadline')[:5]
    progress = int((completed_count / total_tasks) * 100) if total_tasks else 0
    subjects = tasks.values('subject').annotate(count=Count('id')).order_by('-count')
    context = {
        'user': user,
        'tasks': tasks.order_by('-created_at')[:10],
        'total_tasks': total_tasks,
        'completed_count': completed_count,
        'upcoming': upcoming,
        'progress': progress,
        'subjects': subjects,
    }
    return render(request, 'planner/dashboard.html', context)


@login_required
def task_list(request):
    tasks = Task.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'planner/task_list.html', {'tasks': tasks})


@login_required
def task_create(request):
    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            task = form.save(commit=False)
            task.user = request.user
            task.save()
            messages.success(request, 'Task created')
            return redirect('planner:task_list')
    else:
        form = TaskForm()
    return render(request, 'planner/task_form.html', {'form': form})


@login_required
def task_edit(request, pk):
    task = get_object_or_404(Task, pk=pk, user=request.user)
    if request.method == 'POST':
        form = TaskForm(request.POST, instance=task)
        if form.is_valid():
            form.save()
            messages.success(request, 'Task updated')
            return redirect('planner:task_list')
    else:
        form = TaskForm(instance=task)
    return render(request, 'planner/task_form.html', {'form': form, 'task': task})


@login_required
def task_delete(request, pk):
    task = get_object_or_404(Task, pk=pk, user=request.user)
    if request.method == 'POST':
        task.delete()
        messages.success(request, 'Task deleted')
        return redirect('planner:task_list')
    return render(request, 'planner/task_form.html', {'task': task})


@login_required
def task_toggle(request, pk):
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.status = 'completed' if task.status != 'completed' else 'pending'
    task.save()
    return redirect('planner:task_list')


@login_required
def tasks_json(request):
    # Return JSON for real-time polling
    tasks = Task.objects.filter(user=request.user).order_by('deadline')
    data = []
    for t in tasks:
        data.append({
            'id': t.id,
            'title': t.task_title,
            'subject': t.subject,
            'deadline': t.deadline.isoformat() if t.deadline else None,
            'priority': t.priority,
            'status': t.status,
        })
    return JsonResponse({'tasks': data})


@login_required
def search_tasks(request):
    q = request.GET.get('q', '')
    subject = request.GET.get('subject', '')
    filters = Q(user=request.user)
    if q:
        filters &= Q(task_title__icontains=q) | Q(description__icontains=q)
    if subject:
        filters &= Q(subject__iexact=subject)
    tasks = Task.objects.filter(filters).values('id', 'task_title', 'subject', 'status', 'deadline')
    return JsonResponse({'results': list(tasks)})
