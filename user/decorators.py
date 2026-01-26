from django.shortcuts import redirect
from functools import wraps


def user_not_authenticated(function=None, redirect_url='/'):
    """
    Decorator for views that checks that the user is NOT logged in, redirecting
    to the homepage if necessary by default.
    """
    def decorator(view_funct):
        @wraps(view_funct)
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated:
                return redirect(redirect_url)
            return view_funct(request, *args, **kwargs)
        return _wrapped_view

    if function:
        return decorator(function)

    return decorator
