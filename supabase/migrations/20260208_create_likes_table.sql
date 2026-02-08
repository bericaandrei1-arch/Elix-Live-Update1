-- Create likes table for videos
CREATE TABLE IF NOT EXISTS likes (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (video_id, user_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id, created_at DESC);
CREATE INDEX idx_likes_video_id ON likes(video_id);

-- Grant permissions
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like videos" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike videos" ON likes
    FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON likes TO authenticated;
