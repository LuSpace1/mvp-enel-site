from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import AnonymousAuthSerializer


class AnonymousAuthView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = AnonymousAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)

    def get(self, request):
        return Response({"detail": "Método no permitido."}, status=405)


class AdminAuthView(TokenObtainPairView):
    permission_classes = []

    def get(self, request):
        return Response({"detail": "Use POST para autenticarse."}, status=405)
