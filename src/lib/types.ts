
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  bio: string;
  distance: number | null;
  location?: any; // Can be string or object
  distance_meters?: number;
  blocked_users?: string[];
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
    lastMessageTime: string | null; // Will be an ISO date string
}
