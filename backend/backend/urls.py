from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Must come before the SPA catch-all below, otherwise the catch-all's regex
# (which only excludes static/api/ws/admin/) matches /media/... first and
# serves index.html instead of the actual uploaded file.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    # Serve React SPA index.html for any frontend route
    re_path(r'^(?!static/|media/|api/|ws/|admin/).*$', TemplateView.as_view(template_name='index.html')),
]
