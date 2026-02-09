/** Generic API response types. */

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ErrorResponse {
  detail: string;
  status_code: number;
}
