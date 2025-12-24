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
  receiver_id: string | null;
  group_id: string | null;
  message: string;
  seen: boolean;
  created_at: string;
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
}

export interface TypingStatus {
  [key: string]: boolean;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export type ChatTarget = 
  | { type: 'user'; id: string }
  | { type: 'group'; id: string };
