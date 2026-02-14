import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface SuggestedUser {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
}

export default function FriendsFeed() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch suggested users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // 1. Fetch potential friends
        const { data: usersData, error } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .neq('user_id', user?.id || '')
          .limit(50);

        if (error) throw error;
        
        // 2. Check who we are already following
        let followingMap: Record<string, boolean> = {};
        if (user?.id && usersData && usersData.length > 0) {
            const targetIds = usersData.map((u: any) => u.user_id);
            const { data: followData } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', user.id)
                .in('following_id', targetIds);
            
            if (followData) {
                followData.forEach((f: any) => {
                    followingMap[f.following_id] = true;
                });
            }
        }
        setFollowing(followingMap);

        if (usersData) {
          setSuggestedUsers(usersData.map((p: { user_id: string; username?: string; display_name?: string; avatar_url?: string }) => ({
            id: p.user_id,
            username: p.username || 'user',
            name: p.display_name || p.username || 'User',
            avatar_url: p.avatar_url,
          })));
        }
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user?.id]);

  const handleToggleFollow = async (targetUserId: string) => {
      if (!user?.id) return;
      const isCurrentlyFollowing = !!following[targetUserId];

      // Optimistic update
      setFollowing(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

      try {
          if (isCurrentlyFollowing) {
              // Unfollow
              await supabase
                  .from('followers')
                  .delete()
                  .eq('follower_id', user.id)
                  .eq('following_id', targetUserId);
          } else {
              // Follow
              await supabase
                  .from('followers')
                  .insert({ follower_id: user.id, following_id: targetUserId });
              
              // Insert notification manually to ensure Inbox visibility
              try {
                const { data: currentUser } = await supabase.auth.getUser();
                const username = currentUser.user?.user_metadata?.username || 'Someone';
                
                await supabase.from('notifications').insert({
                    user_id: targetUserId,
                    type: 'follow',
                    actor_id: user.id,
                    title: 'New Follower',
                    body: `${username} started following you`,
                    is_read: false
                });
              } catch (err) {
                 console.error("Failed to send notification", err);
              }
          }
      } catch (error) {
          console.error("Toggle follow failed:", error);
          // Revert on error
          setFollowing(prev => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
      }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestedUsers;
    return suggestedUsers.filter(
      (u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [query, suggestedUsers]);

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-1" title="Back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h1 className="text-lg font-bold">Friends</h1>
          </div>
          <button onClick={() => navigate('/search')} aria-label="Search"><Search size={24} /></button>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-2 bg-transparent border border-transparent rounded-2xl px-3 py-2">
            <Search size={18} className="text-white/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search friends"
              aria-label="Search friends"
            />
          </div>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="w-8 h-8 border-2 border-[#E6B36A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[55vh] text-center p-8 opacity-60">
              <UserPlus size={48} className="mb-4" />
              <h2 className="text-xl font-bold mb-2">No results</h2>
              <p>Try a different search.</p>
            </div>
          ) : (
            filtered.map((u) => {
              const isFollowing = !!following[u.id];
              return (
                <div key={u.id} className="flex items-center justify-between bg-transparent border border-transparent rounded-2xl p-3">
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left"
                    onClick={() => navigate(`/profile/${u.id}`)}
                  >
                    <div className="w-11 h-11 bg-gray-700 rounded-full overflow-hidden">
                      <img
                        src={u.avatar_url || ''}
                        alt={u.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{u.username}</div>
                      <div className="text-xs text-white/60">{u.name}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                      isFollowing
                        ? 'bg-transparent border-transparent text-white'
                        : 'bg-[#E6B36A] border-[#E6B36A] text-black'
                    }`}
                    onClick={() => handleToggleFollow(u.id)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
