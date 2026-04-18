export interface AddressBook {
  id: number;
  name: string;
  contactCount?: number;
}

export interface Contact {
  id?: number;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ContactDTO {
  id?: number;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  username: string;
}

// ── Search / Count ─────────────────────────────────────────────────────────
export interface ContactCountMap {
  [key: string]: number;
}
