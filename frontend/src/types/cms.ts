export type CmsFieldType =
  'text' | 'textarea' | 'rich' | 'url' | 'youtube' | 'image' | 'number' | 'select' | 'list'

export interface CmsFieldOption {
  value: string
  label: string
}

export interface CmsFieldSchema {
  key: string
  label: string
  type: CmsFieldType
  default: unknown
  required: boolean
  help_text: string
  max_length?: number
  options?: CmsFieldOption[]
  item_fields?: CmsFieldSchema[]
  max_items?: number
}

export interface CmsSectionSchema {
  key: string
  label: string
  description: string
  reorderable: boolean
  fixed_position: number | null
  fields: CmsFieldSchema[]
}

export interface CmsSchemaResponse {
  sections: CmsSectionSchema[]
  default_order: string[]
  can_publish: boolean
}

export interface RichTextDoc {
  type: 'doc'
  content?: RichTextNode[]
}

export interface RichTextNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  content?: RichTextNode[]
}

export type CmsFieldValue = string | number | RichTextDoc | CmsListItem[] | null
export type CmsListItem = Record<string, CmsFieldValue>
export type CmsSectionValues = Record<string, CmsFieldValue>

export interface CmsPayload {
  version: number
  order: string[]
  sections: Record<string, CmsSectionValues>
}

export interface CmsPublicResponse {
  payload: CmsPayload
  revision_id: string
  revision_version: number
  published_at: string | null
  updated_at: string
}

export interface CmsUserRef {
  id: string
  username: string
  name: string
}

export interface CmsRevision {
  id: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  status_label: string
  version: number
  message: string
  created_by: CmsUserRef | null
  updated_by: CmsUserRef | null
  published_by: CmsUserRef | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface CmsRevisionDetail extends CmsRevision {
  payload: CmsPayload
}

export interface CmsAdminContent {
  draft: CmsRevisionDetail
  published: CmsRevision
  can_publish: boolean
  user: CmsUserRef
}

export interface CmsSaveDraftResponse {
  draft: CmsRevisionDetail
  can_publish: boolean
}

export interface CmsPublishResponse {
  published: CmsRevision
  draft: CmsRevisionDetail
}

export interface CmsMedia {
  id: string
  url: string
  mime_type: string
  size: number
  width: number | null
  height: number | null
  checksum: string
  original_name: string
  alt: string
  created_by: CmsUserRef | null
  created_at: string
}

export interface CmsCapabilities {
  can_edit_cms: boolean
  can_publish_cms: boolean
}
