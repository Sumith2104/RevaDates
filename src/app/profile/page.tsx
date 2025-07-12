import { AppShell } from '@/components/shared/app-shell';
import { ProfileView } from '@/components/profile/profile-view';

const currentUser = {
  name: 'Taylor',
  email: 'taylor@example.com',
  phone: '555-0101',
  dob: new Date('1995-08-15'),
  photos: [
    'https://placehold.co/400x400.png',
    'https://placehold.co/400x400.png',
    'https://placehold.co/400x400.png',
    'https://placehold.co/400x400.png'
  ],
  bio: 'A bit of a wanderer, a bit of a homebody. I love exploring new cities as much as I love a cozy night in with a good movie. My friends would describe me as loyal, funny, and always up for a new experience. Looking for someone with a kind heart and a curious mind.',
};

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileView user={currentUser} />
    </AppShell>
  );
}
