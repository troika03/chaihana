
export interface Dish {
  id: number;
  name: string;
  category: 'soups' | 'main' | 'salads' | 'drinks' | 'desserts';
  price: number;
  image: string;
  description: string;
  available: boolean;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface UserProfile {
  id: string; // UUID from Supabase Auth
  full_name: string;
  phone: string;
  address: string;
  role: 'admin' | 'user';
}

export interface Courier {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
}

export interface Order {
  id: number;
  user_id?: string;
  created_at: string;
  items: CartItem[]; // Stored as JSONB in DB
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cooking' | 'delivering' | 'delivered' | 'cancelled';
  delivery_address: string;
  contact_phone: string;
  comment?: string;
  payment_method: 'card' | 'cash';
  payment_status: 'pending' | 'succeeded' | 'failed';
  assigned_courier_id?: number;
  is_rated?: boolean;

  // Compatibility fields for mock data
  total?: number;
  address?: string;
  phone?: string;
  date?: string;
}
