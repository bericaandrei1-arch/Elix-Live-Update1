import React, { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadAvatar } from '../lib/avatarUpload';
import { useAuthStore } from '../store/useAuthStore';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const displayAvatar = user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'User')}&background=random`;

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    if (!user) {
      setAvatarError('You must be logged in to change your avatar.');
      return;
    }

    setAvatarError(null);
    setIsUploadingAvatar(true);

    try {
      const publicUrl = await uploadAvatar(file, user.id);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (error) throw new Error(error.message);
      updateUser({ avatar: publicUrl });
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : 'Avatar upload failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 flex justify-center">
      <div className="w-full max-w-[500px]">
        <header className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
            <h1 className="font-bold text-lg">Edit profile</h1>
            <button className="text-gray-400">Save</button>
        </header>

        <div className="flex flex-col items-center mb-8">
            <div className="relative">
                <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden opacity-70 cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Camera size={24} />
                </div>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleAvatarFile(e.target.files?.[0])} 
                />
            </div>
            <p className="text-sm mt-2 text-gray-300">Change photo</p>
            {isUploadingAvatar && <div className="text-xs text-white/70 mt-1">Uploading...</div>}
            {avatarError && <div className="text-xs text-rose-300 mt-1">{avatarError}</div>}
        </div>

        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <label className="w-1/4 text-sm text-gray-300">Name</label>
                <input type="text" defaultValue="User Name" className="w-3/4 bg-transparent border-b border-gray-700 focus:border-white outline-none py-1" />
            </div>
            <div className="flex justify-between items-center">
                <label className="w-1/4 text-sm text-gray-300">Username</label>
                <input type="text" defaultValue="username" className="w-3/4 bg-transparent border-b border-gray-700 focus:border-white outline-none py-1" />
            </div>
            <div className="flex justify-between items-center">
                <label className="w-1/4 text-sm text-gray-300">Bio</label>
                <textarea defaultValue="Welcome to my profile! 🎥" className="w-3/4 bg-transparent border-b border-gray-700 focus:border-white outline-none py-1 resize-none h-20" />
            </div>
             <div className="flex justify-between items-center">
                <label className="w-1/4 text-sm text-gray-300">Website</label>
                <input type="text" defaultValue="linktr.ee/username" className="w-3/4 bg-transparent border-b border-gray-700 focus:border-white outline-none py-1" />
            </div>
        </div>
      </div>
    </div>
  );
}
