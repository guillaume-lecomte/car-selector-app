import { type PaginationMeta } from './api/interfaces';

export type SelectionFormData = {
  brandId: number | null;
  modelId: number | null;
  year: number | null;
};

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: Record<string, unknown>;
  status?: number;
}

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
} | ApiErrorResponse;

export interface UseApiOptions<T> {
  onSuccess?: (data: T, meta?: PaginationMeta) => void;
  onError?: (error: ApiErrorResponse) => void;
}

export interface UseApiReturn<T> {
  data: T | null;
  error: ApiErrorResponse | null;
  isLoading: boolean;
  paginationMeta: PaginationMeta | null;
  fetchData: (url: string, fetchOptions?: RequestInit) => Promise<T>;
  setData: (data: T | null) => void;
  setError: (error: ApiErrorResponse | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPaginationMeta: (meta: PaginationMeta | null) => void;
  reset: () => void;
}

export type FeedbackMessage = {
  type: 'success' | 'error';
  text: string;
};

export type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export type AlertProps = {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
  className?: string;
};


export type FormErrors = Record<string, string>;

export type FormState<T> = {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  message: FeedbackMessage | null;
};
