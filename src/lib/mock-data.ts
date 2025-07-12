import type { UserProfile } from './types';

export const mockUsers: UserProfile[] = [
  {
    id: '1',
    name: 'Jessica',
    age: 28,
    photos: ['https://placehold.co/600x800.png', 'https://placehold.co/600x800.png'],
    bio: "Lover of sunny days, hiking trails, and a good book. Looking for someone to share adventures and laughter with. Let's create our own story!",
    distance: 5,
  },
  {
    id: '2',
    name: 'Alex',
    age: 32,
    photos: ['https://placehold.co/600x800.png', 'https://placehold.co/600x800.png'],
    bio: "Software engineer by day, aspiring chef by night. I'm passionate about technology, cooking, and exploring new cultures. Seeking a genuine connection.",
    distance: 2,
  },
  {
    id: '3',
    name: 'Emily',
    age: 25,
    photos: ['https://placehold.co/600x800.png'],
    bio: 'Art history student with a love for museums, coffee shops, and indie films. My dog is my best friend. Looking for a kind soul with a good sense of humor.',
    distance: 8,
  },
  {
    id: '4',
    name: 'David',
    age: 30,
    photos: ['https://placehold.co/600x800.png', 'https://placehold.co/600x800.png'],
    bio: "Fitness enthusiast and personal trainer. I believe in a healthy body and a healthy mind. If you're active and love the outdoors, we'll get along great.",
    distance: 12,
  },
];
