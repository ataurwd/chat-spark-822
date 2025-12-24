export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  seen: boolean;
  created_at: string;
}

export interface TypingStatus {
  [key: string]: boolean;
}
