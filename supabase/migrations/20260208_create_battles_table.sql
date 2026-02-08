-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    challenger_id UUID NOT NULL REFERENCES auth.users(id),
    opponent_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    challenger_score INTEGER NOT NULL DEFAULT 0,
    opponent_score INTEGER NOT NULL DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Battles visible to everyone" ON battles
    FOR SELECT USING (true);

CREATE POLICY "Only the challenger (stream owner) can create a battle" ON battles
    FOR INSERT WITH CHECK (
        auth.uid() = challenger_id
        AND EXISTS (
            SELECT 1 FROM live_streams 
            WHERE id = stream_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can update (accept, score)" ON battles
    FOR UPDATE USING (
        auth.uid() = challenger_id OR auth.uid() = opponent_id
    );

-- Create indexes
CREATE INDEX idx_battles_stream_id ON battles(stream_id);
CREATE INDEX idx_battles_challenger_id ON battles(challenger_id);
CREATE INDEX idx_battles_opponent_id ON battles(opponent_id);
CREATE INDEX idx_battles_status ON battles(status);
