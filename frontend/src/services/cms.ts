import { http } from '@/lib/http'
import type {
  CmsAdminContent,
  CmsMedia,
  CmsPublicResponse,
  CmsPublishResponse,
  CmsRevision,
  CmsSaveDraftResponse,
  CmsSchemaResponse,
} from '@/types/cms'

export async function obtenerContenidoPublico(): Promise<CmsPublicResponse> {
  const { data } = await http.get<CmsPublicResponse>('/cms/public/')
  return data
}

export async function obtenerSchema(): Promise<CmsSchemaResponse> {
  const { data } = await http.get<CmsSchemaResponse>('/cms/admin/schema/')
  return data
}

export async function obtenerContenidoAdmin(): Promise<CmsAdminContent> {
  const { data } = await http.get<CmsAdminContent>('/cms/admin/content/')
  return data
}

export async function guardarBorrador(
  payload: unknown,
  version: number,
  message = '',
): Promise<CmsSaveDraftResponse> {
  const { data } = await http.put<CmsSaveDraftResponse>('/cms/admin/content/', {
    payload,
    version,
    message,
  })
  return data
}

export async function publicarContenido(message = ''): Promise<CmsPublishResponse> {
  const { data } = await http.post<CmsPublishResponse>('/cms/admin/publish/', { message })
  return data
}

export async function obtenerRevisiones(): Promise<CmsRevision[]> {
  const { data } = await http.get<{ results: CmsRevision[] }>('/cms/admin/revisions/')
  return data.results
}

export async function restaurarRevision(id: string): Promise<CmsSaveDraftResponse> {
  const { data } = await http.post<CmsSaveDraftResponse>(`/cms/admin/revisions/${id}/restore/`, {})
  return data
}

export async function subirImagen(file: File, alt = ''): Promise<CmsMedia> {
  const form = new FormData()
  form.append('file', file)
  if (alt) form.append('alt', alt)
  const { data } = await http.post<CmsMedia>('/cms/admin/media/', form)
  return data
}
