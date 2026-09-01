from rest_framework import generics
from rest_framework.response import Response

from users.permissions import IsPlatformAdmin

from .models import VideoLink
from .serializers import VideoLinkSerializer


class PublicVideoListView(generics.ListAPIView):
    permission_classes = []
    queryset = VideoLink.objects.all()
    serializer_class = VideoLinkSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["count"] = len(response.data)
        return response


class AdminVideoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsPlatformAdmin]
    queryset = VideoLink.objects.all()
    serializer_class = VideoLinkSerializer


class AdminVideoDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsPlatformAdmin]
    queryset = VideoLink.objects.all()
    serializer_class = VideoLinkSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data["download_url"] = instance.youtube_url
        return Response(data)
