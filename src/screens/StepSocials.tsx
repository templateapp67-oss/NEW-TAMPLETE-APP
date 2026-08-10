import { 
  ArrowLeft, ArrowRight, Plus, Trash2, X, Share2, Camera, ThumbsUp, PlayCircle, 
  Video as VideoIcon, CheckCircle2, Check, Monitor, Edit2, Sparkles, Link, ExternalLink
} from 'lucide-react';
import { SalonData, SocialVideo } from '../types';
import PreviewPane from '../components/PreviewPane';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent } from 'react';

interface Props {
  data: SalonData;
  setData: (d: SalonData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

const STOCK_VIDEO_THUMBNAILS = [
  {
    title: 'Hair transformation ✨',
    platform: 'instagram' as const,
    url: 'https://instagram.com/reel/12345',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
    likesCount: '1.2k',
    dateAdded: 'Today'
  },
  {
    title: 'Summer chop ✂️',
    platform: 'youtube' as const,
    url: 'https://youtube.com/shorts/67890',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
    likesCount: '856',
    dateAdded: 'Yesterday'
  },
  {
    title: 'Dimensional Blonde Balayage 👱‍♀️',
    platform: 'instagram' as const,
    url: 'https://instagram.com/reel/34567',
    thumbnailUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop',
    likesCount: '2.4k',
    dateAdded: '3 days ago'
  },
  {
    title: 'Precision Beard Sculpting 💈',
    platform: 'tiktok' as const,
    url: 'https://tiktok.com/@royal/video/98765',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop',
    likesCount: '3.1k',
    dateAdded: '4 days ago'
  }
];

export default function StepSocials({ data, setData, onNext, onPrev, onSave }: Props) {
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states for adding a social video
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoPlatform, setNewVideoPlatform] = useState<'instagram' | 'youtube' | 'facebook' | 'tiktok'>('instagram');
  const [newVideoThumbnail, setNewVideoThumbnail] = useState(STOCK_VIDEO_THUMBNAILS[0].thumbnailUrl);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Social profiles handlers
  const profiles = data.socialProfiles || {
    instagram: 'https://instagram.com/aurasalon_mumbai',
    facebook: '',
    youtube: '',
    tiktok: ''
  };

  const handleProfileChange = (key: keyof typeof profiles, value: string) => {
    const updatedProfiles = { ...profiles, [key]: value };
    setData({ ...data, socialProfiles: updatedProfiles });
    if (onSave) onSave();
  };

  // Videos list
  const videoList = data.socialVideos || [];

  const handleAddVideo = (e: FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim()) {
      showFeedback('Please enter a caption or video title');
      return;
    }

    const newVideo: SocialVideo = {
      id: 'v-' + Date.now(),
      title: newVideoTitle.trim(),
      platform: newVideoPlatform,
      url: newVideoUrl.trim() || `https://${newVideoPlatform}.com/reel/${Date.now()}`,
      thumbnailUrl: newVideoThumbnail,
      dateAdded: 'Today',
      likesCount: Math.floor(Math.random() * 900 + 100) + ' likes'
    };

    setData({
      ...data,
      socialVideos: [newVideo, ...videoList]
    });

    setIsAddingVideo(false);
    setNewVideoUrl('');
    setNewVideoTitle('');
    showFeedback('Added social video successfully!');
    if (onSave) onSave();
  };

  const handleDeleteVideo = (id: string) => {
    const updated = videoList.filter(v => v.id !== id);
    setData({ ...data, socialVideos: updated });
    showFeedback('Social video removed');
    if (onSave) onSave();
  };

  const handleQuickAddPreset = (preset: typeof STOCK_VIDEO_THUMBNAILS[0]) => {
    const newVideo: SocialVideo = {
      id: 'v-' + Date.now(),
      ...preset
    };
    setData({
      ...data,
      socialVideos: [newVideo, ...videoList]
    });
    showFeedback(`Added "${preset.title}"`);
    if (onSave) onSave();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full bg-[#f9f9f9]">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex bg-white border-b border-[#eeeeee] p-2 gap-2 shrink-0 z-30">
        <button
          onClick={() => setMobileTab('edit')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'edit' ? 'bg-[#ac0053] text-white' : 'bg-[#f9f9f9] text-[#5f5e5e]'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit Socials
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'preview' ? 'bg-[#ac0053] text-white' : 'bg-[#f9f9f9] text-[#5f5e5e]'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" /> Live Preview
        </button>
      </div>

      {/* LEFT COLUMN: Management Form (55% desktop layout) */}
      <div className={`w-full md:w-[55%] h-full flex flex-col relative bg-[#f9f9f9] border-r border-[#eeeeee] ${mobileTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
          <div className="max-w-2xl mx-auto pb-32 space-y-6">

            {/* Header */}
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#ac0053] uppercase flex items-center gap-1">
                <Share2 className="w-4 h-4" /> STEP 07 • SOCIAL CONNECTIVITY
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1c1c] mt-1 mb-1">
                Connect your social media
              </h1>
              <p className="text-[#5f5e5e] text-sm leading-relaxed">
                Add your profiles and short videos. They'll appear directly on your website to build social proof and showcase real client transformations.
              </p>
            </div>

            {/* Toast Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#ffd9e1] border border-[#ac0053]/30 text-[#ac0053] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> {feedback}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SECTION 1: SOCIAL PROFILES */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#eeeeee] shadow-2xs space-y-5">
              <h2 className="text-base font-bold text-[#1a1c1c] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ac0053]"></span> Social Profiles
              </h2>

              <div className="space-y-4">
                {/* Instagram Profile */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#ac0053]" /> Instagram Profile
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={profiles.instagram || ''}
                      onChange={e => handleProfileChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#ac0053] focus:bg-white transition-all pr-28"
                    />
                    <div className="absolute right-3 flex items-center gap-1 text-[#ac0053]">
                      {profiles.instagram ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[11px] font-bold">Connected</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-400">Not connected</span>
                      )}
                    </div>
                  </div>
                  {profiles.instagram && (
                    <p className="text-[11px] text-gray-500 font-medium pl-1">
                      @{profiles.instagram.split('/').filter(Boolean).pop()}
                    </p>
                  )}
                </div>

                {/* Facebook Profile */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-blue-600" /> Facebook Page/Profile
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={profiles.facebook || ''}
                      onChange={e => handleProfileChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#ac0053] focus:bg-white transition-all pr-24"
                    />
                    <button
                      type="button"
                      onClick={() => handleProfileChange('facebook', profiles.facebook || 'https://facebook.com/royalhairstudio')}
                      className="absolute right-3 text-xs font-bold text-[#ac0053] hover:underline"
                    >
                      {profiles.facebook ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* YouTube Channel */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-red-600" /> YouTube Channel
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={profiles.youtube || ''}
                      onChange={e => handleProfileChange('youtube', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#ac0053] focus:bg-white transition-all pr-24"
                    />
                    <button
                      type="button"
                      onClick={() => handleProfileChange('youtube', profiles.youtube || 'https://youtube.com/@royalhairstudio')}
                      className="absolute right-3 text-xs font-bold text-[#ac0053] hover:underline"
                    >
                      {profiles.youtube ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* TikTok Profile */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <VideoIcon className="w-4 h-4 text-black" /> TikTok Profile
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={profiles.tiktok || ''}
                      onChange={e => handleProfileChange('tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@yourhandle"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#ac0053] focus:bg-white transition-all pr-24"
                    />
                    <button
                      type="button"
                      onClick={() => handleProfileChange('tiktok', profiles.tiktok || 'https://tiktok.com/@royalhairstudio')}
                      className="absolute right-3 text-xs font-bold text-[#ac0053] hover:underline"
                    >
                      {profiles.tiktok ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: SHOW YOUR WORK (SOCIAL VIDEOS) */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#eeeeee] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#1a1c1c] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ac0053]"></span> Show your work
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Paste links to your existing Reels, Shorts or TikTok videos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingVideo(true)}
                  className="bg-[#ffd9e1] text-[#ac0053] hover:bg-[#ac0053] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Social Video
                </button>
              </div>

              {/* Video Cards List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {videoList.map((video) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3.5 p-3 border border-gray-200 rounded-xl bg-[#f9f9f9] hover:bg-white hover:shadow-xs transition-all group"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-gray-200">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-xs rounded-full p-1 text-[#ac0053] shadow-xs">
                          {video.platform === 'youtube' ? (
                            <PlayCircle className="w-3.5 h-3.5 text-red-600" />
                          ) : video.platform === 'tiktok' ? (
                            <VideoIcon className="w-3.5 h-3.5 text-black" />
                          ) : (
                            <Camera className="w-3.5 h-3.5 text-pink-600" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{video.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 capitalize">
                          {video.platform} Reel • {video.dateAdded || 'Recently Added'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {videoList.length === 0 && (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2">
                    <VideoIcon className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs font-bold text-gray-600">No social videos added yet</p>
                    <p className="text-[11px] text-gray-400">Add reels or shorts to showcase your salon work in live preview.</p>
                  </div>
                )}
              </div>

              {/* Quick Add Presets */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Quick Add Sample Reels
                </span>
                <div className="flex flex-wrap gap-2">
                  {STOCK_VIDEO_THUMBNAILS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickAddPreset(preset)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-[#ffd9e1]/40 hover:text-[#ac0053] border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FOOTER NAVIGATION */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onPrev}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={onNext}
                className="px-6 py-2.5 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sticky Live Preview (45% desktop layout) */}
      <div className={`w-full md:w-[45%] h-full bg-[#f3f3f4] relative overflow-hidden ${mobileTab === 'edit' ? 'hidden md:flex' : 'flex'}`}>
        <PreviewPane data={data} step={6} />
      </div>

      {/* MODAL: ADD SOCIAL VIDEO */}
      <AnimatePresence>
        {isAddingVideo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <VideoIcon className="w-5 h-5 text-[#ac0053]" /> Add Social Video
                </h3>
                <button
                  onClick={() => setIsAddingVideo(false)}
                  className="text-gray-400 hover:text-black p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddVideo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Platform</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['instagram', 'youtube', 'facebook', 'tiktok'] as const).map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setNewVideoPlatform(plat)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold capitalize border transition-all text-center ${
                          newVideoPlatform === plat
                            ? 'bg-[#ac0053] text-white border-[#ac0053]'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Video Link / URL</label>
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={e => setNewVideoUrl(e.target.value)}
                    placeholder="e.g. https://instagram.com/reel/C3x91..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#ac0053] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Caption / Title</label>
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={e => setNewVideoTitle(e.target.value)}
                    placeholder="e.g. Summer Haircut & Styling Process ✨"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#ac0053] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Select Thumbnail</label>
                  <div className="grid grid-cols-4 gap-2">
                    {STOCK_VIDEO_THUMBNAILS.map((thumb, idx) => (
                      <div
                        key={idx}
                        onClick={() => setNewVideoThumbnail(thumb.thumbnailUrl)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          newVideoThumbnail === thumb.thumbnailUrl ? 'border-[#ac0053] scale-105 shadow-xs' : 'border-gray-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={thumb.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingVideo(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-[#ac0053] text-white font-bold rounded-xl hover:bg-[#ba005b] shadow-xs"
                  >
                    Add Video
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
