export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  plan?: string;
  notification_preferences?: {
    notify_low_stock?: boolean;
    notify_po_completed?: boolean;
    notify_daily_digest?: boolean;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
