from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.generic import TemplateView
from api.views import serve_protected_media

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Must come before the SPA catch-all below. There's no separate web server
# (nginx/WhiteNoise only handles STATIC_ROOT, not MEDIA_ROOT) fronting this
# monolithic deploy, so uploaded files/recordings need Django itself to serve
# them. Django's own `static()` helper looks like the idiomatic way to do
# this, but it's hardcoded to no-op unless DEBUG=True — it's meant for local
# dev only — so it was silently leaving /media/ unhandled in production and
# every download 404'd. Using django.views.static.serve directly would fix
# the 404 but drop all access control (it has no auth concept of its own),
# so this goes through serve_protected_media, which requires the same token
# auth as every other endpoint before it will stream the file.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve_protected_media, {'document_root': settings.MEDIA_ROOT}),
]

urlpatterns += [
    # Serve React SPA index.html for any frontend route
    re_path(r'^(?!static/|media/|api/|ws/|admin/).*$', TemplateView.as_view(template_name='index.html')),
]
