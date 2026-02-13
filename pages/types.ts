
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
  id: string;
  full_name: string;
  phone?: string;
  address: string;
  role: 'admin' | 'user';
}

export interface Order {
  id: number;
  user_id?: string;
  created_at: string;
  items: CartItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cooking' | 'delivering' | 'delivered' | 'cancelled';
  delivery_address: string;
  contact_phone?: string;
  comment?: string;
  payment_method: 'card';
  payment_status: 'pending' | 'succeeded' | 'failed';
  assigned_courier_id?: number;
}

export interface SupportMessage {
  id: number;
  user_id?: string;
  user_name: string;
  message: string;
  created_at: string;
  status: 'new' | 'read';
}
