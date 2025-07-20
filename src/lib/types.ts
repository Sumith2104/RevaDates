
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  bio: string;
  blocked_users?: string[];
  location?: string | null;
  distance?: string | null;
  distance_meters?: number | null;
}

export interface Match {
    id: string;
    matchedUser: {
        id: string;
        name: string;
        photos: string[] | null;
    };
}

export interface Chat {
    id: string;
    matchedUser: {
        id: string;
        name: string;
        photos: string[] | null;
    };
    lastMessage: string | null;
    lastMessageTime: string | null;
}

export type Notification = {
    id: string;
    message: string;
    created_at: string; 
    is_read: boolean;
    type: 'new_like' | 'new_match';
    sender_id: string;
    sender: {
        name: string;
        photos: string[] | null;
    } | null;
}

export type Message = {
    id: string | number;
    match_id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    created_at: string;
    tempId?: string; // Optional temporary ID for optimistic UI
    is_read: boolean;
};
