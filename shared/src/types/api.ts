// ---- API Response Wrappers ----

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  offset: number
  limit: number
}
