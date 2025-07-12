'use server';

import { suggestProfileImprovements } from '@/ai/flows/suggest-profile-improvements';
import { z } from 'zod';

const SuggestionSchema = z.object({
  profileDescription: z.string().min(20, {
    message: 'Profile description must be at least 20 characters long.',
  }),
});

export async function getProfileSuggestions(prevState: any, formData: FormData) {
  const validatedFields = SuggestionSchema.safeParse({
    profileDescription: formData.get('profileDescription'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.profileDescription?.[0] || "Invalid input.",
    };
  }

  try {
    const result = await suggestProfileImprovements({
      profileDescription: validatedFields.data.profileDescription,
    });
    return { suggestion: result.improvedDescription };
  } catch (e) {
    return { error: 'Failed to get suggestions. Please try again.' };
  }
}
