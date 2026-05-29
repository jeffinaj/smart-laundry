from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from channels.db import database_sync_to_async


class TokenAuthMiddleware:
    """Token auth middleware for Django Channels WebSockets."""

    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return TokenAuthMiddlewareInstance(scope, self)


class TokenAuthMiddlewareInstance:
    def __init__(self, scope, middleware):
        self.scope = dict(scope)
        self.inner = middleware.inner

    async def __call__(self, receive, send):
        token = self._get_token_from_scope()
        if token:
            user = await self.get_user_from_token(token)
            self.scope['user'] = user or AnonymousUser()
        else:
            self.scope['user'] = AnonymousUser()

        inner = self.inner(self.scope)
        return await inner(receive, send)

    def _get_token_from_scope(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        token = params.get('token')
        return token[0] if token else None

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            auth = JWTAuthentication()
            validated_token = auth.get_validated_token(token)
            return auth.get_user(validated_token)
        except Exception:
            return None
