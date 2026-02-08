-- Live Streams Table
CREATE TABLE live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_live BOOLEAN DEFAULT false,
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    stream_key TEXT UNIQUE NOT NULL,
    rtmp_url TEXT,
    playback_url TEXT,
    tags TEXT[],
    category TEXT DEFAULT 'General',
    is_private BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    quality TEXT DEFAULT '720p',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_moderator BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'emoji', 'gift', 'system')),
    gift_id TEXT,
    gift_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live Viewers Table
CREATE TABLE live_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_moderator BOOLEAN DEFAULT false,
    is_streamer BOOLEAN DEFAULT false,
    is_following BOOLEAN DEFAULT false,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- Stream Moderators Table
CREATE TABLE stream_moderators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    can_ban BOOLEAN DEFAULT true,
    can_mute BOOLEAN DEFAULT true,
    can_pin BOOLEAN DEFAULT true,
    can_delete_messages BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

-- Banned Users Table
CREATE TABLE stream_banned_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    banned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(stream_id, user_id)
);

-- Muted Users Table
CREATE TABLE stream_muted_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    muted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    muted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(stream_id, user_id)
);

-- Stream Analytics Table
CREATE TABLE stream_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
    peak_viewers INTEGER DEFAULT 0,
    total_unique_viewers INTEGER DEFAULT 0,
    total_chat_messages INTEGER DEFAULT 0,
    total_gifts_received INTEGER DEFAULT 0,
    total_gift_value INTEGER DEFAULT 0,
    average_watch_duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX idx_live_streams_category ON live_streams(category);
CREATE INDEX idx_live_streams_started_at ON live_streams(started_at DESC);

CREATE INDEX idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

CREATE INDEX idx_live_viewers_stream_id ON live_viewers(stream_id);
CREATE INDEX idx_live_viewers_user_id ON live_viewers(user_id);
CREATE INDEX idx_live_viewers_joined_at ON live_viewers(joined_at DESC);

CREATE INDEX idx_stream_moderators_stream_id ON stream_moderators(stream_id);
CREATE INDEX idx_stream_moderators_user_id ON stream_moderators(user_id);

CREATE INDEX idx_stream_banned_users_stream_id ON stream_banned_users(stream_id);
CREATE INDEX idx_stream_banned_users_user_id ON stream_banned_users(user_id);

CREATE INDEX idx_stream_muted_users_stream_id ON stream_muted_users(stream_id);
CREATE INDEX idx_stream_muted_users_user_id ON stream_muted_users(user_id);

CREATE INDEX idx_stream_analytics_stream_id ON stream_analytics(stream_id);

-- Row Level Security (RLS) Policies
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;

-- Live Streams Policies
CREATE POLICY "Users can view public streams" ON live_streams
    FOR SELECT
    USING (is_private = false OR user_id = auth.uid());

CREATE POLICY "Users can create their own streams" ON live_streams
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own streams" ON live_streams
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own streams" ON live_streams
    FOR DELETE
    USING (user_id = auth.uid());

-- Chat Messages Policies
CREATE POLICY "Anyone can view chat messages for public streams" ON chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = chat_messages.stream_id 
            AND live_streams.is_private = false
        )
    );

CREATE POLICY "Authenticated users can send messages if not banned or muted" ON chat_messages
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = chat_messages.stream_id 
            AND live_streams.allow_comments = true
            AND live_streams.is_private = false
        ) AND
        NOT EXISTS (
            SELECT 1 FROM stream_banned_users
            WHERE stream_banned_users.stream_id = chat_messages.stream_id
            AND stream_banned_users.user_id = auth.uid()
        ) AND
        NOT EXISTS (
            SELECT 1 FROM stream_muted_users
            WHERE stream_muted_users.stream_id = chat_messages.stream_id
            AND stream_muted_users.user_id = auth.uid()
        )
    );

-- Live Viewers Policies
CREATE POLICY "Anyone can view viewers for public streams" ON live_viewers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = live_viewers.stream_id 
            AND live_streams.is_private = false
        )
    );

CREATE POLICY "Authenticated users can join public streams" ON live_viewers
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = live_viewers.stream_id 
            AND live_streams.is_private = false
        ) AND
        NOT EXISTS (
            SELECT 1 FROM stream_banned_users
            WHERE stream_banned_users.stream_id = live_viewers.stream_id
            AND stream_banned_users.user_id = auth.uid()
        )
    );

-- Stream Moderators Policies
CREATE POLICY "Streamers can manage moderators" ON stream_moderators
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = stream_moderators.stream_id 
            AND live_streams.user_id = auth.uid()
        )
    );

-- Banned and Muted Users Policies
CREATE POLICY "Streamers can manage banned users" ON stream_banned_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = stream_banned_users.stream_id 
            AND live_streams.user_id = auth.uid()
        )
    );

CREATE POLICY "Streamers can manage muted users" ON stream_muted_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = stream_muted_users.stream_id 
            AND live_streams.user_id = auth.uid()
        )
    );

-- Stream Analytics Policies
CREATE POLICY "Streamers can view their analytics" ON stream_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM live_streams 
            WHERE live_streams.id = stream_analytics.stream_id 
            AND live_streams.user_id = auth.uid()
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON live_streams TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON live_streams TO authenticated;

GRANT SELECT ON chat_messages TO anon, authenticated;
GRANT INSERT ON chat_messages TO authenticated;

GRANT SELECT ON live_viewers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON live_viewers TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON stream_moderators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stream_banned_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stream_muted_users TO authenticated;

GRANT SELECT ON stream_analytics TO authenticated;

-- Create function to update viewer count
CREATE OR REPLACE FUNCTION update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE live_streams 
        SET viewer_count = viewer_count + 1 
        WHERE id = NEW.stream_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE live_streams 
        SET viewer_count = GREATEST(viewer_count - 1, 0) 
        WHERE id = OLD.stream_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for viewer count updates
CREATE TRIGGER trigger_update_viewer_count
    AFTER INSERT OR DELETE ON live_viewers
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_viewer_count();

-- Create function to update stream analytics
CREATE OR REPLACE FUNCTION update_stream_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO stream_analytics (stream_id)
        VALUES (NEW.id)
        ON CONFLICT (stream_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stream analytics
CREATE TRIGGER trigger_create_stream_analytics
    AFTER INSERT ON live_streams
    FOR EACH ROW
    EXECUTE FUNCTION update_stream_analytics();