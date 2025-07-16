
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
