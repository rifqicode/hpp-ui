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
  active_store_id?: string;
  permissions?: string[];
  store?: {
    id: string;
    name: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterStoreCredentials {
  name: string;
  category?: string;
  location?: string;
  address?: string;
  phone?: string;
  description?: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  store: RegisterStoreCredentials;
}
