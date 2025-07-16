
-- Create the messages table
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    match_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE,
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add comments to the table and columns
COMMENT ON TABLE public.messages IS 'Stores chat messages between users.';
COMMENT ON COLUMN public.messages.match_id IS 'The match this message belongs to.';
COMMENT ON COLUMN public.messages.sender_id IS 'The user who sent the message.';
COMMENT ON COLUMN public.messages.recipient_id IS 'The user who received the message.';
COMMENT ON COLUMN public.messages.content IS 'The text content of the message.';

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the messages table

-- Policy: Allow users to view their own messages (either as sender or recipient)
CREATE POLICY "Allow users to view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy: Allow users to insert messages into their own matches
CREATE POLICY "Allow users to insert messages in their matches"
ON public.messages
FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1
        FROM public.matches
        WHERE id = messages.match_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
);

-- Grant usage for the sequence if any (gen_random_uuid doesn't need it, but good practice)
GRANT ALL ON TABLE public.messages TO authenticated, service_role;
