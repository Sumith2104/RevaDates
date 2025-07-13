'use client';

import { useActionState, useFormStatus } from 'react';
import { getProfileSuggestions } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState = {
  suggestion: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Get Suggestions
    </Button>
  );
}

export function AiAssistView() {
  const [state, formAction] = useActionState(getProfileSuggestions, initialState);

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>AI Profile Assistant</CardTitle>
            <CardDescription>
              Write your current profile description below and our AI will help you make it even better.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="profileDescription">Your profile description</Label>
              <Textarea
                id="profileDescription"
                name="profileDescription"
                placeholder="Your Profile Description..."
                rows={8}
                required
              />
              {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>

      {state.suggestion && (
        <Alert className="mt-6">
          <Wand2 className="h-4 w-4" />
          <AlertTitle>Here's a suggestion!</AlertTitle>
          <AlertDescription>
            <p className="text-foreground whitespace-pre-wrap">{state.suggestion}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
