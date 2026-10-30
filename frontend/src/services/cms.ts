import { http } from '@/lib/http'
import type {
  CmsAdminContent,
  CmsMedia,
  CmsPublicResponse,
  CmsPublishResponse,
  CmsRevision,
  CmsRevisionDetail,
  CmsSaveDraftResponse,
  CmsSchemaResponse,
  CmsStartEditingResponse,
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

export async function activarEdicion(): Promise<CmsStartEditingResponse> {
  const { data } = await http.post<CmsStartEditingResponse>('/cms/admin/content/editing/', {})
  return data
}

export async function guardarBorrador(
  payload: unknown,
  lockVersion: number,
  message = '',
): Promise<CmsSaveDraftResponse> {
  const { data } = await http.put<CmsSaveDraftResponse>('/cms/admin/content/', {
    payload,
    lock_version: lockVersion,
    message,
  })
  return data
}

export async function publicarContenido(
  lockVersion: number,
  message = '',
): Promise<CmsPublishResponse> {
  const { data } = await http.post<CmsPublishResponse>('/cms/admin/publish/', {
    lock_version: lockVersion,
    message,
  })
  return data
}

export async function obtenerRevision(id: string): Promise<CmsRevisionDetail> {
  const { data } = await http.get<CmsRevisionDetail>(`/cms/admin/revisions/${id}/`)
  return data
}

export async function obtenerRevisiones(): Promise<CmsRevision[]> {
  const { data } = await http.get<{ results: CmsRevision[] }>('/cms/admin/revisions/')
  return data.results
}

export async function descartarBorrador(): Promise<CmsSaveDraftResponse> {
  const { data } = await http.post<CmsSaveDraftResponse>('/cms/admin/content/discard/', {})
  return data
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
