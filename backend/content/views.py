from rest_framework import generics
from rest_framework.response import Response

from apps.authentication.permissions import IsPortalAdmin

from .models import VideoLink
from .serializers import VideoLinkSerializer


class PublicVideoListView(generics.ListAPIView):
    permission_classes = []
    queryset = VideoLink.objects.all()
    serializer_class = VideoLinkSerializer


class AdminVideoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsPortalAdmin]
    queryset = VideoLink.objects.all()
    serializer_class = VideoLinkSerializer


class AdminVideoDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsPortalAdmin]
    queryset = VideoLink.objects.all()
    serializer_class = VideoLinkSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data["download_url"] = instance.youtube_url
        return Response(data)
