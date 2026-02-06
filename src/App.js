import API_URL from "./config";
import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Heart,
  Share2,
  Search,
  Plus,
  TrendingUp,
  Music,
  Briefcase,
  Trophy,
  Palette,
  Menu,
  X,
  BarChart3,
  Eye,
  Trash2,
  Upload,
  LogOut,
  User as UserIcon,
  AlertCircle,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  Send,
  Edit,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Star,
  CheckCircle,
} from "lucide-react";

// Isolated Comment Input Component
const CommentInput = React.memo(({ postId, onSubmit, authToken, API_URL, showInfoToast, showSuccessToast, showErrorToast }) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/feed-comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            post_id: postId,
            content: inputValue.trim(),
            parent_comment_id: null,
          }),
        },
      );

      if (response.ok) {
        setInputValue('');
        onSubmit(postId);
        showSuccessToast("Comment added!");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      showErrorToast("Failed to add comment");
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter" && inputValue.trim()) {
            handleSubmit();
          }
        }}
        placeholder="Write a comment..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />
      <button
        onClick={handleSubmit}
        disabled={!inputValue.trim()}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span className="hidden sm:inline">Send</span>
      </button>
    </div>
  );
});

// Memoized Post Component to prevent unnecessary re-renders
const FeedPostItem = React.memo(({ 
  post, 
  user, 
  events,
  getInitial,
  handleDeleteFeedComment,
  handleAddFeedComment,
  deleteFeedPost,
  getTrendingScore,
  getDiscussionCount,
  feedReactions,
  feedComments,
  showFeedComments,
  setShowFeedComments,
  commentInputs,
  replyingToFeed,
  setReplyingToFeed,
  replyText,
  setCommentInputs,
  setReplyText,
  authToken,
  API_URL,
  setModalImage,
  setModalEventTitle,
  setShowImageModal,
  setView,
  showErrorToast,
  Send
}) => {
  const event = events.find(e => e.id === post.event_id);
  
  return (
    <div
      key={post.id}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* We'll fill this in next step */}
    </div>
  );
});

const categories = [
  { id: "all", name: "All Events", icon: Menu },
  { id: "music", name: "Music", icon: Music },
  { id: "tech", name: "Tech", icon: Briefcase },
  { id: "sports", name: "Sports", icon: Trophy },
  { id: "arts", name: "Arts", icon: Palette },
];

function App() {
  const getInitial = (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return 'U';
    }
    return name.trim().charAt(0).toUpperCase();
  };
  const [view, setView] = useState("login");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState("posts"); // 'posts', 'events', 'attended'
  const [editingProfile, setEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editInterests, setEditInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedEvents, setLikedEvents] = useState([]);
  const [rsvpStatus, setRsvpStatus] = useState({}); // Track RSVP status for each event
  const [eventRSVPs, setEventRSVPs] = useState({}); // Track all RSVPs for events

  // ADD RECOMMENDATION STATES:
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [recommendationReason, setRecommendationReason] = useState({}); // { eventId: reason }

  // MOBILE OPTIMIZATION STATES:
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Event feed state
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    type: "comment",
    content: "",
    media_url: "",
  });
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [postReactions, setPostReactions] = useState({}); // Track reactions for each post
  const [postComments, setPostComments] = useState({}); // Track comments for each post
  const [showComments, setShowComments] = useState({}); // Track which posts have comments open
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const [pollingInterval, setPollingInterval] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  // Event chat state
  const [eventMessages, setEventMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const [modalEventTitle, setModalEventTitle] = useState("");

  // Direct messages state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [newDmMessage, setNewDmMessage] = useState("");
  const [loadingDms, setLoadingDms] = useState(false);

  // NEW: Enhanced messaging states
  const [unreadCounts, setUnreadCounts] = useState({}); // { userId: unreadCount }
  const [typingUsers, setTypingUsers] = useState({}); // { userId: timestamp }
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Set of online user IDs
  const [messageReadStatus, setMessageReadStatus] = useState({}); // { messageId: readAt }
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState({}); // { userId: timestamp }

  // Follow state
  const [followingEvents, setFollowingEvents] = useState([]);
  const [followingOrganizers, setFollowingOrganizers] = useState([]);
  const [isFollowing, setIsFollowing] = useState({});
  const [followerCounts, setFollowerCounts] = useState({});

  // Buddy system state
  const [buddyRequests, setBuddyRequests] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [buddyStatus, setBuddyStatus] = useState({});
  const [buddiesTab, setBuddiesTab] = useState("my-buddies");
  const [suggestedBuddies, setSuggestedBuddies] = useState([]);
  const [mutualConnections, setMutualConnections] = useState({});

  // ADD THESE SOCIAL PROOF STATES:
  const [eventAttendees, setEventAttendees] = useState({}); // { eventId: [users] }
  const [mutualBuddies, setMutualBuddies] = useState({}); // { eventId: [buddies] }
  const [buddyActivity, setBuddyActivity] = useState([]); // Recent buddy RSVPs
  const [showBuddyActivity, setShowBuddyActivity] = useState(false);

  // Social feed state
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedFilter, setFeedFilter] = useState("all"); // 'all', 'live', 'upcoming', 'past'
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [newFeedPost, setNewFeedPost] = useState({
    eventId: null,
    eventTitle: "",
    eventDate: "",
    eventLocation: "",
    content: "",
    mediaUrl: "",
    postType: "text",
    eventPhase: "upcoming",
  });
  const [postComposerEvent, setPostComposerEvent] = useState(null);

  // Explore page state
  const [exploreCategory, setExploreCategory] = useState("all");
  const [exploreSortBy, setExploreSortBy] = useState("upcoming"); // 'upcoming', 'trending', 'popular', 'nearby'

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: "all", // 'all', 'today', 'weekend', 'week', 'month'
    priceRange: "all", // 'all', 'free', 'under1000', 'under5000', 'premium'
    categories: [], // Array of selected category IDs
    verified: false,
    distance: "all", // 'all', 'nearby', 'city'
  });
  const [savedSearches, setSavedSearches] = useState([]);

  // My Events page state
  const [eventsFilter, setEventsFilter] = useState("all");

  // ADD MY EVENTS DISCOVERY STATES:
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [friendEvents, setFriendEvents] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  // Feed interactions state
  const [feedReactions, setFeedReactions] = useState({});
  const [feedComments, setFeedComments] = useState({});
  const [showFeedComments, setShowFeedComments] = useState({});
const [commentInputs, setCommentInputs] = useState({});
const [replyingToFeed, setReplyingToFeed] = useState(null);
const [replyText, setReplyText] = useState("");
const commentInputRefs = useRef({});
  const [showPassword, setShowPassword] = useState(false);

  // Add these new states:
  const [forgotPasswordView, setForgotPasswordView] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const messagesEndRef = useRef(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "organizer",
  });

  // Form validation state
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  const [signupErrors, setSignupErrors] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [eventFormErrors, setEventFormErrors] = useState({});

  const [newEvent, setNewEvent] = useState({
    title: "",
    category: "music",
    date: "",
    time: "",
    location: "",
    price: "",
    description: "",
    lineup: "",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    privacy: "public",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  // Toast Notification Component
  const ToastNotification = () => {
    if (!toast.show) return null;

    const colors = {
      success: "from-green-500 to-emerald-500",
      error: "from-red-500 to-pink-500",
      info: "from-blue-500 to-cyan-500",
    };

    const icons = {
      success: "✓",
      error: "✕",
      info: "ℹ",
    };

    return (
      <div className="fixed top-4 right-4 z-[9999] animate-fade-in">
        <div
          className={`bg-gradient-to-r ${colors[toast.type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}
        >
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl font-bold">
            {icons[toast.type]}
          </div>
          <p className="flex-1 font-medium">{toast.message}</p>
          <button
            onClick={() => setToast({ show: false, message: "", type: "info" })}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Stats Modal Component
  const StatsModal = ({
    show,
    onClose,
    tab,
    userPosts,
    userEvents,
    attendedEvents,
  }) => {
    if (!show) return null;

    const tabs = [
      { id: "posts", name: "Posts", count: userPosts.length, icon: "📝" },
      { id: "events", name: "Events", count: userEvents.length, icon: "🎉" },
      {
        id: "attended",
        name: "Attended",
        count: attendedEvents.length,
        icon: "✓",
      },
    ];

    const currentTab = tabs.find((t) => t.id === tab);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{currentTab.icon}</span>
                {currentTab.name}
              </h2>
              <p className="text-sm text-gray-600">{currentTab.count} total</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 py-3 border-b bg-white">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveStatsTab(t.id)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.count}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {tab === "posts" && (
              <div className="space-y-3">
                {userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-40">📝</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-600">
                      Share your first event experience!
                    </p>
                  </div>
                ) : (
                  userPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      {post.content && (
                        <p className="text-gray-900 mb-2">{post.content}</p>
                      )}
                      {(post.media_url || post.image) && (
                        <img
                          src={(post.media_url || post.image)}
                          alt="Post"
                          className="w-full rounded-lg max-h-48 object-cover mb-2"
                        />
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{post.event_title}</span>
                        <span>•</span>
                        <span>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "events" && (
              <div className="space-y-3">
                {userEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-40">🎉</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No events created
                    </h3>
                    <p className="text-gray-600">
                      Create your first event to get started!
                    </p>
                  </div>
                ) : (
                  userEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setView("event-detail");
                        onClose();
                      }}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 truncate">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{event.attending || 0} attending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "attended" && (
              <div className="space-y-3">
                {attendedEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-40">✓</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No events attended
                    </h3>
                    <p className="text-gray-600">RSVP to your first event!</p>
                  </div>
                ) : (
                  attendedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setView("event-detail");
                        onClose();
                      }}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 truncate">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Edit Profile Modal Component
  const EditProfileModal = ({
    show,
    onClose,
    user,
    bio,
    interests,
    onSave,
  }) => {
    const [localBio, setLocalBio] = useState(bio);
    const [localInterests, setLocalInterests] = useState(interests);
    const [newInterest, setNewInterest] = useState("");

    if (!show) return null;

    const availableInterests = [
      { id: "music", name: "Music", icon: "🎵" },
      { id: "sports", name: "Sports", icon: "⚽" },
      { id: "food", name: "Foodie", icon: "🍕" },
      { id: "travel", name: "Travel", icon: "✈️" },
      { id: "tech", name: "Tech", icon: "💻" },
      { id: "art", name: "Art", icon: "🎨" },
      { id: "fitness", name: "Fitness", icon: "💪" },
      { id: "gaming", name: "Gaming", icon: "🎮" },
      { id: "reading", name: "Reading", icon: "📚" },
      { id: "photography", name: "Photography", icon: "📸" },
      { id: "cooking", name: "Cooking", icon: "👨‍🍳" },
      { id: "dancing", name: "Dancing", icon: "💃" },
    ];

    const addInterest = (interest) => {
      if (!localInterests.find((i) => i.id === interest.id)) {
        setLocalInterests([...localInterests, interest]);
      }
    };

    const removeInterest = (interestId) => {
      setLocalInterests(localInterests.filter((i) => i.id !== interestId));
    };

    const addCustomInterest = () => {
      if (newInterest.trim() && localInterests.length < 10) {
        const customInterest = {
          id: `custom-${Date.now()}`,
          name: newInterest.trim(),
          icon: "✨",
        };
        setLocalInterests([...localInterests, customInterest]);
        setNewInterest("");
      }
    };

    const handleSave = () => {
      onSave(localBio, localInterests);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-600">
                Customize your bio and interests
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Bio Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Bio
              </label>
              <textarea
                value={localBio}
                onChange={(e) => setLocalBio(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows="3"
                maxLength="150"
                placeholder="Tell people about yourself..."
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Use emojis and be creative!
                </p>
                <p className="text-xs text-gray-500">{localBio.length}/150</p>
              </div>
            </div>

            {/* Interests Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Interests ({localInterests.length}/10)
              </label>

              {/* Selected Interests */}
              {localInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl">
                  {localInterests.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => removeInterest(interest.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-sm font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all group"
                    >
                      <span>{interest.icon}</span>
                      <span>{interest.name}</span>
                      <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}

              {/* Available Interests */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Popular interests:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest) => {
                    const isSelected = localInterests.find(
                      (i) => i.id === interest.id,
                    );
                    return (
                      <button
                        key={interest.id}
                        onClick={() => !isSelected && addInterest(interest)}
                        disabled={isSelected || localInterests.length >= 10}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${isSelected
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-500 hover:text-indigo-600"
                          }`}
                      >
                        <span>{interest.icon}</span>
                        <span>{interest.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Interest Input */}
              {localInterests.length < 10 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Or add your own:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomInterest();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Type custom interest..."
                      maxLength="20"
                    />
                    <button
                      onClick={addCustomInterest}
                      disabled={!newInterest.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading Spinner Component
  const LoadingSpinner = ({ size = "md", color = "white" }) => {
    const sizes = {
      sm: "w-4 h-4 border-2",
      md: "w-6 h-6 border-2",
      lg: "w-8 h-8 border-3",
    };

    const colors = {
      white: "border-white border-t-transparent",
      purple: "border-indigo-600 border-t-transparent",
      gray: "border-gray-400 border-t-transparent",
    };

    return (
      <div
        className={`${sizes[size]} ${colors[color]} border-solid rounded-full animate-spin`}
      ></div>
    );
  };

  // Enhanced Skeleton Loader Components
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
      <div className="p-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-full"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonPost = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-full"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-4/5"></div>
      </div>
      <div className="w-full h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
    </div>
  );

  const SkeletonGrid = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  // ============================================
  // MESSAGING UI COMPONENTS
  // ============================================

  // Online Status Indicator
  const OnlineIndicator = ({ userId }) => {
    const isOnline = onlineUsers.has(userId);

    if (!isOnline) return null;

    return (
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
    );
  };

  // Typing Indicator Component
  const TypingIndicator = ({ userName }) => (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
      <span>{userName} is typing...</span>
    </div>
  );

  // Read Receipt Component
  const ReadReceipt = ({ message, currentUserId }) => {
    if (message.sender_id !== currentUserId) return null;

    const isRead = messageReadStatus[message.id];

    return (
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
        {isRead ? (
          <>
            <svg
              className="w-3 h-3 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              <path d="M12.707 5.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0z" />
            </svg>
            <span>Seen</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
            <span>Sent</span>
          </>
        )}
      </div>
    );
  };

  // ============================================
  // EMPTY STATE COMPONENTS
  // ============================================

  const EmptyState = ({
    icon,
    title,
    description,
    actionText,
    onAction,
    actionIcon,
  }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-6xl mb-6 opacity-40">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
        >
          {actionIcon && <span className="text-xl">{actionIcon}</span>}
          {actionText}
        </button>
      )}
    </div>
  );

  const FeedEmptyState = ({ onCreatePost }) => (
    <EmptyState
      icon="🎉"
      title="No posts yet"
      description="Be the first to share what's happening! Create a post about an upcoming event or share memories from past events."
      actionText="Create First Post"
      actionIcon="✨"
      onAction={onCreatePost}
    />
  );

  const MyEventsEmptyState = ({ filter, onCreateEvent, onExplore }) => {
    const messages = {
      all: {
        icon: "🎭",
        title: "No events yet",
        description:
          "You haven't created or joined any events. Start exploring or create your own!",
        actions: [
          { text: "Create Event", icon: "➕", primary: true },
          { text: "Explore Events", icon: "🔍", primary: false },
        ],
      },
      live: {
        icon: "🔴",
        title: "No live events",
        description:
          "You don't have any events happening right now. Check your upcoming events!",
      },
      upcoming: {
        icon: "📅",
        title: "No upcoming events",
        description:
          "You haven't RSVP'd to any upcoming events. Explore what's happening!",
      },
      past: {
        icon: "💭",
        title: "No past events",
        description:
          "You haven't attended any events yet. Your event history will appear here.",
      },
    };

    const { icon, title, description, actions } =
      messages[filter] || messages.all;

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="text-6xl mb-6 opacity-50">{icon}</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
          {description}
        </p>
        {actions && (
          <div className="flex gap-3">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.primary ? onCreateEvent : onExplore}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${action.primary
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className="text-xl">{action.icon}</span>
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProfileNoPostsState = ({ isOwnProfile, onCreatePost }) => (
    <EmptyState
      icon={isOwnProfile ? "📝" : "🤷"}
      title={isOwnProfile ? "You haven't posted yet" : "No posts yet"}
      description={
        isOwnProfile
          ? "Share your event experiences, moments, and updates with the community!"
          : "This user hasn't shared any posts yet."
      }
      actionText={isOwnProfile ? "Create Your First Post" : null}
      actionIcon={isOwnProfile ? "✍️" : null}
      onAction={isOwnProfile ? onCreatePost : null}
    />
  );

  const ProfileNoEventsState = ({ isOwnProfile, onCreateEvent }) => (
    <EmptyState
      icon={isOwnProfile ? "🎪" : "📭"}
      title={isOwnProfile ? "No events yet" : "No events"}
      description={
        isOwnProfile
          ? "Create your first event and start building your community. It's easy to get started!"
          : "This user hasn't created any events yet."
      }
      actionText={isOwnProfile ? "Create Your First Event" : null}
      actionIcon={isOwnProfile ? "➕" : null}
      onAction={isOwnProfile ? onCreateEvent : null}
    />
  );

  const ExploreNoResultsState = ({ category, onResetFilters }) => (
    <EmptyState
      icon="🔍"
      title={`No ${category === "all" ? "" : category} events found`}
      description="Try selecting a different category or check back later for new events in this category."
      actionText="View All Events"
      actionIcon="🌟"
      onAction={onResetFilters}
    />
  );

  const MessagesEmptyState = ({ onExploreEvents }) => (
    <EmptyState
      icon="💬"
      title="No messages yet"
      description="Join event chats or connect with other attendees to start conversations!"
      actionText="Explore Events"
      actionIcon="🎉"
      onAction={onExploreEvents}
    />
  );

  const BuddiesEmptyState = ({ onExploreEvents }) => (
    <EmptyState
      icon="🤝"
      title="No buddies yet"
      description="Attend events and connect with other attendees to build your network!"
      actionText="Explore Events"
      actionIcon="🔍"
      onAction={onExploreEvents}
    />
  );

  const FollowingEmptyState = ({ type, onExploreEvents }) => (
    <EmptyState
      icon={type === "events" ? "⭐" : "👥"}
      title={`Not following any ${type}`}
      description={
        type === "events"
          ? "Follow events you're interested in to stay updated on their activity!"
          : "Follow organizers you like to see all their upcoming events!"
      }
      actionText="Explore Events"
      actionIcon="🔍"
      onAction={onExploreEvents}
    />
  );

  const AttendeesEmptyState = () => (
    <EmptyState
      icon="👥"
      title="No attendees yet"
      description="Be the first to RSVP to this event! Let the organizer know you're coming."
      actionText={null}
    />
  );

  const CommentsEmptyState = ({ onAddComment }) => (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
      <div className="text-4xl mb-3 opacity-40">💬</div>
      <p className="text-gray-500 text-sm mb-4">
        No comments yet. Be the first to share your thoughts!
      </p>
      {onAddComment && (
        <button
          onClick={onAddComment}
          className="text-gray-900 text-sm font-semibold hover:text-indigo-700 transition-colors"
        >
          Add a comment
        </button>
      )}
    </div>
  );

  const EventChatEmptyState = ({ eventName }) => (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-5xl mb-4 opacity-40">💬</div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">
        Welcome to the chat!
      </h3>
      <p className="text-gray-500 text-sm max-w-sm">
        Connect with other attendees of{" "}
        <span className="font-semibold">{eventName}</span>. Say hi and share
        your excitement!
      </p>
    </div>
  );

  const PendingRequestsEmptyState = () => (
    <EmptyState
      icon="✉️"
      title="No pending requests"
      description="When you send or receive buddy requests, they'll appear here."
      actionText={null}
    />
  );

  useEffect(() => {
    const initAuth = async () => {
      console.log("🔍 initAuth: Starting auth check");
      const token = localStorage.getItem("authToken");
      console.log("🔍 initAuth: Token from storage:", token ? "EXISTS" : "NULL");

      if (token) {
        setAuthToken(token);
        // Try to fetch current user
        try {
          console.log("🔍 initAuth: Calling /api/auth/me");
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          console.log("🔍 initAuth: Response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("🔍 initAuth: User data received:", data);
            setUser(data);
            setView("discover"); // Restore to feed if logged in
            console.log("🔍 initAuth: Set view to discover");
          } else {
            console.log("❌ initAuth: Token invalid, logging out");
            // Token invalid, clear it
            localStorage.removeItem("authToken");
            setAuthToken(null);
            setView("login");
          }
        } catch (error) {
          console.error("❌ initAuth: Error:", error);
          console.error("Auth check failed:", error);
          localStorage.removeItem("authToken");
          setAuthToken(null);
          setView("login");
        }
      } else {
        console.log("🔍 initAuth: No token, going to login");
        // No token, go to login
        setView("login");
      }
      console.log("🔍 initAuth: Setting authLoading to false");
      setAuthLoading(false); // Done checking
    };

    initAuth();
  }, []); // Empty array = run once on mount


  useEffect(() => {
    fetchEvents();
    fetchFeedPosts();
    if (authToken) {
      fetchCurrentUser();
      fetchConversations(); // Load conversations for badge
      fetchPendingRequests(); // Load pending requests for badge
    }
  }, [authToken]);

  useEffect(() => {
    if (view === "dm-conversation" && dmMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [dmMessages, view]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log(API_URL);

    // Validate before submitting
    let errors = {};
    if (!authForm.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(authForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!authForm.password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    //await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        setAuthToken(data.token);
        setUser(data.user);
        setAuthForm({ email: "", password: "", name: "", role: "organizer" });
        setView("discover");
      } else {
        setAuthError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Connection error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate before submitting
    let errors = {};

    if (!authForm.name || authForm.name.trim() === "") {
      errors.name = "Name is required";
    }

    if (!authForm.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(authForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!authForm.password) {
      errors.password = "Password is required";
    } else {
      const passwordCheck = validatePassword(authForm.password);
      if (
        !passwordCheck.length ||
        !passwordCheck.hasUpper ||
        !passwordCheck.hasNumber
      ) {
        errors.password = "Password must meet all requirements";
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (authForm.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setSignupErrors(errors);
      return;
    }
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
          name: authForm.name,
          role: "organizer",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        setAuthToken(data.token);
        setUser(data.user);
        setAuthForm({ email: "", password: "", name: "", role: "organizer" });
        setView("discover");
      } else {
        setAuthError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError("Connection error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      showErrorToast("Please enter your email address");
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      showErrorToast("Please enter a valid email address");
      return;
    }

    setAuthLoading(true);

    try {
      // TODO: Implement backend endpoint for password reset
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (response.ok) {
        setResetEmailSent(true);
        showSuccessToast("Password reset link sent to your email!");
      } else {
        const data = await response.json();
        showErrorToast(data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      // For MVP: Show success anyway (graceful degradation)
      setResetEmailSent(true);
      showSuccessToast(
        "If an account exists with this email, you will receive a password reset link.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
    setUser(null);
    setView("login");
    showSuccessToast("Logged out successfully");
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewEvent({ ...newEvent, image: data.url });
      } else {
        showErrorToast("Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showErrorToast("Failed to upload image. Please check your connection.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;

    setUploadingProfilePic(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update user object with new profile picture
        setUser({ ...user, profile_picture: data.url });
        showSuccessToast("Profile picture updated!");
      } else {
        showErrorToast("Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showErrorToast("Failed to upload profile picture");
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleSaveProfile = (bio, interests) => {
    // Update user object with new bio and interests
    setUser({
      ...user,
      bio: bio,
      interests: interests,
    });

    // Update local states
    setEditBio(bio);
    setEditInterests(interests);

    showSuccessToast("Profile updated successfully!");

    // TODO: You can add API call here to persist to backend
    fetch(`${API_URL}/api/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ bio, interests }),
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "all" || event.category === selectedCategory;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLike = (eventId) => {
    setLikedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const handleCreateEvent = async () => {
    if (!authToken) {
      showInfoToast("Please login to create events");
      setView("login");
      return;
    }

    // Validate the form
    const errors = validateEventForm(newEvent);

    if (Object.keys(errors).length > 0) {
      setEventFormErrors(errors);
      showErrorToast("Please fix the errors in the form");
      return;
    }

    // Clear any previous errors
    setEventFormErrors({});

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...newEvent,
          lineup: newEvent.lineup
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          privacy: newEvent.privacy || "public",
        }),
      });

      if (response.ok) {
        await fetchEvents();
        setNewEvent({
          title: "",
          category: "music",
          date: "",
          time: "",
          location: "",
          price: "",
          description: "",
          lineup: "",
          image:
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
          privacy: "public",
        });
        setEventFormErrors({});
        showSuccessToast("Event created successfully!");
        setView("discover");
      } else {
        const data = await response.json();
        showErrorToast(data.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      showErrorToast("Failed to create event. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!authToken) {
      showInfoToast("Please login to delete events");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        const data = await response.json();
        showErrorToast(data.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      showErrorToast("Failed to delete event. Please try again.");
    }
  };

  const handleRSVP = async (eventId, status) => {
    if (!authToken) {
      showInfoToast("Please login to RSVP");
      setView("login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ eventId, status }),
      });

      if (response.ok) {
        setRsvpStatus({ ...rsvpStatus, [eventId]: status });
        // Refresh event RSVPs
        fetchEventRSVPs(eventId);
      }
    } catch (error) {
      console.error("Error saving RSVP:", error);
    }
  };

  const fetchEventRSVPs = async (eventId) => {
    try {
      const response = await fetch(`${API_URL}/api/rsvp/event/${eventId}/all`);
      if (response.ok) {
        const data = await response.json();
        setEventRSVPs({ ...eventRSVPs, [eventId]: data });
      }
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
    }
  };

  const fetchUserRSVP = async (eventId) => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/api/rsvp/event/${eventId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          setRsvpStatus({ ...rsvpStatus, [eventId]: data.status });
        }
      }
    } catch (error) {
      console.error("Error fetching user RSVP:", error);
    }
  };

  const handleShare = (event) => {
    const eventUrl = `${window.location.origin}?event=${event.id}`;
    const shareText = `Check out this event: ${event.title}\n${event.date} at ${event.time}\n${event.location}\n\n`;
    // Show share options
    if (navigator.share) {
      // Use native share if available (mobile)
      navigator
        .share({
          title: event.title,
          text: shareText,
          url: eventUrl,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Desktop: show custom share menu
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + eventUrl)}`;
      const copyText = shareText + eventUrl;

      // Copy to clipboard
      navigator.clipboard
        .writeText(copyText)
        .then(() => {
          showSuccessToast(
            "Event link copied to clipboard!\n\nYou can also share via WhatsApp.",
          );
          // Open WhatsApp in new tab
          if (window.confirm("Open WhatsApp to share?")) {
            window.open(whatsappUrl, "_blank");
          }
        })
        .catch(() => {
          showInfoToast(
            "Could not copy link. Please copy manually:\n\n" + copyText,
          );
        });
    }
  };

  const fetchPostsForEvent = async (eventId, showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingPosts(true);
      }
      const response = await fetch(`${API_URL}/api/posts/event/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        // Fetch reactions for each post
        // data.forEach(post => {
        //   fetchPostReactions(post.id);
        //   fetchPostComments(post.id);
        // });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      if (showLoading) {
        setLoadingPosts(false);
      }
    }
  };

  const handleReaction = async (postId, reaction) => {
    if (!authToken) {
      showInfoToast("Please login to react");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ postId, reaction }),
      });

      if (response.ok) {
        fetchPostReactions(postId);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const fetchPostReactions = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/reactions/post/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPostReactions((prev) => ({ ...prev, [postId]: data }));
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  const handleAddComment = async (postId, comment, parentCommentId = null) => {
    if (!authToken) {
      showInfoToast("Please login to comment");
      return;
    }

    if (!comment || comment.trim().length === 0) {
      showInfoToast("Comment cannot be empty");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ postId, comment, parentCommentId }),
      });

      if (response.ok) {
        fetchPostComments(postId);
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const fetchPostComments = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/comments/post/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPostComments((prev) => ({ ...prev, [postId]: data }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!authToken) {
      showInfoToast("Please login to delete comments");
      return;
    }

    if (!window.confirm("Delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        fetchPostComments(postId);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

 // Polling for real-time updates
const startPolling = (eventId) => {
  const interval = setInterval(async () => {
    // Fetch from both sources during polling
    try {
      const [feedPostsResponse, eventPostsResponse] = await Promise.all([
        fetch(`${API_URL}/api/feed-posts`),
        fetch(`${API_URL}/api/posts/event/${eventId}`),
      ]);

      let allPosts = [];

      if (feedPostsResponse.ok) {
        const feedData = await feedPostsResponse.json();
        const eventFeedPosts = feedData.filter(
          (post) => post.event_id === eventId,
        );
        allPosts = [...eventFeedPosts];
      }

      if (eventPostsResponse.ok) {
        const eventData = await eventPostsResponse.json();
        allPosts = [...allPosts, ...eventData];
      }

      const uniquePosts = allPosts.filter(
        (post, index, self) =>
          index === self.findIndex((p) => p.id === post.id),
      );

      uniquePosts.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      
      // Only update if posts actually changed
      setPosts(prevPosts => {
        if (JSON.stringify(prevPosts) === JSON.stringify(uniquePosts)) {
          return prevPosts; // Return same reference to prevent re-render
        }
        return uniquePosts;
      });
    } catch (error) {
      console.error("Error polling posts:", error);
    }
  }, 5000); // Poll every 5 seconds

  return interval;
};
  // Get Time Until Event
  const getTimeUntilEvent = (event) => {
    if (!event || !event.date || !event.time) return null;

    try {
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const now = new Date();
      const diff = eventDateTime - now;

      if (diff < 0) return null; // Event has passed

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 1) {
        return `Starting in ${minutes}m`;
      } else if (hours < 24) {
        return `Starting in ${hours}h ${minutes}m`;
      } else {
        const days = Math.floor(hours / 24);
        return `Starting in ${days}d`;
      }
    } catch (error) {
      return null;
    }
  };

const handleDeleteFeedComment = async (commentId, postId) => {
  if (!authToken) {
    showInfoToast("Please login to delete comments");
    return;
  }

  if (!window.confirm("Delete this comment?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/feed-comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (response.ok) {
      await fetchFeedComments(postId);
      
      // Update comment count in feed
      setFeedPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comment_count: Math.max((post.comment_count || 0) - 1, 0) }
            : post
        )
      );
      
      showSuccessToast("Comment deleted");
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    showErrorToast("Failed to delete comment");
  }
};

  // Get Phase Badge Config
  const getEventPhaseBadge = (phase) => {
    const badges = {
      live: {
        text: "LIVE NOW",
        icon: "🔴",
        bgColor: "bg-red-500",
        textColor: "text-white",
        borderColor: "border-red-600",
        animate: "animate-pulse",
      },
      "starting-soon": {
        text: "STARTING SOON",
        icon: "⏰",
        bgColor: "bg-orange-500",
        textColor: "text-white",
        borderColor: "border-orange-600",
        animate: "animate-bounce",
      },
      today: {
        text: "TODAY",
        icon: "⭐",
        bgColor: "bg-yellow-500",
        textColor: "text-white",
        borderColor: "border-yellow-600",
        animate: "",
      },
      ended: {
        text: "ENDED",
        icon: "✓",
        bgColor: "bg-gray-500",
        textColor: "text-white",
        borderColor: "border-gray-600",
        animate: "",
      },
      upcoming: {
        text: "UPCOMING",
        icon: "📅",
        bgColor: "bg-indigo-500",
        textColor: "text-white",
        borderColor: "border-indigo-600",
        animate: "",
      },
    };

    return badges[phase] || badges.upcoming;
  };

  // Live Event Badge Component
  const LiveEventBadge = ({ event, size = "md", showCountdown = false }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const phase = getEventPhase(event);
    const badge = getEventPhaseBadge(phase);
    const timeUntil = getTimeUntilEvent(event);

    // Update time every minute for countdown
    useEffect(() => {
      if (showCountdown && (phase === "starting-soon" || phase === "today")) {
        const interval = setInterval(() => {
          setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
      }
    }, [phase, showCountdown]);

    if (phase === "upcoming" && !showCountdown) return null;

    const sizes = {
      sm: "text-xs px-2 py-1",
      md: "text-xs px-3 py-1.5",
      lg: "text-sm px-4 py-2",
    };

    return (
      <div className="inline-flex flex-col gap-1">
        <div
          className={`
        ${badge.bgColor} ${badge.textColor} ${badge.animate}
        ${sizes[size]} rounded-full font-bold
        shadow-lg flex items-center gap-1.5 w-fit
      `}
        >
          <span className="text-sm">{badge.icon}</span>
          <span>{badge.text}</span>
          {phase === "live" && (
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          )}
        </div>

        {showCountdown &&
          timeUntil &&
          phase !== "live" &&
          phase !== "ended" && (
            <div className="text-xs font-semibold text-gray-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full w-fit">
              {timeUntil}
            </div>
          )}
      </div>
    );
  };

  // Calculate suggested buddies
  useEffect(() => {
    if (user && buddies.length > 0 && view === "buddies") {
      calculateSuggestedBuddies();
    }
  }, [buddies, eventRSVPs, events, view, user]);

  // // Fetch buddies when user logs in
  // useEffect(() => {
  //   if (user && authToken) {
  //     fetchAllBuddies();
  //     fetchBuddyActivity();
  //   }
  // }, [user, authToken]);

  // Calculate mutual buddies when events or buddies change
  useEffect(() => {
    if (user && buddies.length > 0 && events.length > 0) {
      calculateMutualBuddiesForEvents(events);
    }
  }, [events, buddies, eventRSVPs]);

  // Event Chat functions
  const fetchEventMessages = async (eventId, showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingMessages(true);
      }
      const response = await fetch(
        `${API_URL}/api/event-messages/event/${eventId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setEventMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  };

  // Generate recommendations when relevant data changes
  useEffect(() => {
    if (user && events.length > 0) {
      updateRecommendations();
    }
  }, [user, events, rsvpStatus, likedEvents, mutualBuddies, isFollowing]);

  // // Load discovery content for My Events
  // useEffect(() => {
  //   if (user && events.length > 0) {
  //     fetchNearbyEvents();
  //     fetchPopularEvents();
  //     fetchFriendEvents();
  //   }
  // }, [user, events, buddies, eventRSVPs]);

  // Fetch buddy activity periodically
  useEffect(() => {
    if (user && buddies.length > 0) {
      // Initial fetch
      fetchBuddyActivity();

      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchBuddyActivity();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, buddies, eventRSVPs]);

  const handleSendMessage = async (eventId) => {
    if (!authToken) {
      showInfoToast("Please login to send messages");
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/event-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ eventId, message: newMessage }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchEventMessages(eventId, false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId, eventId) => {
    if (!authToken) {
      showInfoToast("Please login to delete messages");
      return;
    }

    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/event-messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        fetchEventMessages(eventId, false);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const startChatPolling = (eventId) => {
    const interval = setInterval(() => {
      fetchEventMessages(eventId, false);
    }, 3000); // Poll every 3 seconds for chat

    return interval;
  };

  const calculateSuggestedBuddies = () => {
    const suggestions = new Map();

    // Find people from same events
    Object.entries(eventRSVPs).forEach(([eventId, rsvps]) => {
      const goingList = rsvps.going || [];
      goingList.forEach((attendee) => {
        if (
          attendee.user_id !== user.id &&
          !buddies.some((b) => b.buddy_id === attendee.user_id)
        ) {
          const key = attendee.user_id;
          if (!suggestions.has(key)) {
            suggestions.set(key, {
              ...attendee,
              score: 0,
              reasons: [],
              mutualBuddies: 0,
              sharedEvents: [],
            });
          }
          const suggestion = suggestions.get(key);
          suggestion.score += 2;
          suggestion.sharedEvents.push(eventId);

          // Check for mutual buddies
          const mutuals = buddies.filter((buddy) => {
            // This would need backend support to know buddy's connections
            return false; // Placeholder
          });
          suggestion.mutualBuddies = mutuals.length;

          if (suggestion.sharedEvents.length > 1) {
            suggestion.reasons.push(
              `${suggestion.sharedEvents.length} shared events`,
            );
          }
        }
      });
    });

    // Convert to array and sort by score
    const sorted = Array.from(suggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setSuggestedBuddies(sorted);
  };

  // Direct Messages functions
  const fetchConversations = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/direct-messages/conversations`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data);

        // Calculate unread counts for each conversation
        const unreadMap = {};
        data.forEach((conv) => {
          // Count unread messages (messages from other user that haven't been read)
          unreadMap[conv.other_user_id] = conv.unread_count || 0;
        });
        setUnreadCounts(unreadMap);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchDmConversation = async (otherUserId, showLoading = true) => {
    if (!authToken) return;

    try {
      if (showLoading) {
        setLoadingDms(true);
      }
      const response = await fetch(
        `${API_URL}/api/direct-messages/conversation/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setDmMessages(data);

        // Mark messages as read
        await markMessagesAsRead(otherUserId);
      }
    } catch (error) {
      console.error("Error fetching DM conversation:", error);
    } finally {
      if (showLoading) {
        setLoadingDms(false);
      }
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (otherUserId) => {
    if (!authToken) return;

    try {
      await fetch(`${API_URL}/api/direct-messages/mark-read/${otherUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Update local unread counts
      setUnreadCounts((prev) => ({
        ...prev,
        [otherUserId]: 0,
      }));

      // Refresh conversations to update badge
      fetchConversations();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Handle typing indicator
  let typingTimeout;
  const handleTyping = (otherUserId) => {
    // Show local typing indicator
    setTypingUsers((prev) => ({
      ...prev,
      [otherUserId]: Date.now(),
    }));

    // Clear typing indicator after 3 seconds
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[otherUserId];
        return updated;
      });
    }, 3000);
  };

  const handleSendDm = async (receiverId, receiverName) => {
    if (!authToken) {
      showInfoToast("Please login to send messages");
      return;
    }

    if (!newDmMessage.trim()) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/direct-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          receiverId,
          receiverName,
          message: newDmMessage,
        }),
      });

      if (response.ok) {
        setNewDmMessage("");
        fetchDmConversation(receiverId, false);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending DM:", error);
    }
  };

  const handleDeleteDm = async (messageId, otherUserId) => {
    if (!authToken) {
      showInfoToast("Please login to delete messages");
      return;
    }

    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/direct-messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        fetchDmConversation(otherUserId, false);
      }
    } catch (error) {
      console.error("Error deleting DM:", error);
    }
  };

  const startDmPolling = (otherUserId) => {
    const interval = setInterval(() => {
      fetchDmConversation(otherUserId, false);
      fetchConversations();
    }, 3000); // Poll every 3 seconds

    return interval;
  };

  // Follow system functions
  const handleFollow = async (followedType, followedId, followedName) => {
    if (!authToken) {
      showInfoToast("Please login to follow");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/follows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ followedType, followedId, followedName }),
      });

      if (response.ok) {
        setIsFollowing({
          ...isFollowing,
          [`${followedType}-${followedId}`]: true,
        });
        fetchFollowerCount(followedType, followedId);
      } else {
        const data = await response.json();
        showErrorToast(data.error || "Failed to follow");
      }
    } catch (error) {
      console.error("Error following:", error);
    }
  };

  const handleUnfollow = async (followedType, followedId) => {
    if (!authToken) {
      showInfoToast("Please login to unfollow");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/follows/unfollow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ followedType, followedId }),
      });

      if (response.ok) {
        setIsFollowing({
          ...isFollowing,
          [`${followedType}-${followedId}`]: false,
        });
        fetchFollowerCount(followedType, followedId);
      }
    } catch (error) {
      console.error("Error unfollowing:", error);
    }
  };

  const checkIsFollowing = async (followedType, followedId) => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/follows/check/${followedType}/${followedId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setIsFollowing({
          ...isFollowing,
          [`${followedType}-${followedId}`]: data.isFollowing,
        });
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const fetchFollowerCount = async (followedType, followedId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/follows/count/${followedType}/${followedId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setFollowerCounts({
          ...followerCounts,
          [`${followedType}-${followedId}`]: data.count,
        });
      }
    } catch (error) {
      console.error("Error fetching follower count:", error);
    }
  };

  const fetchUserFollowing = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/api/follows/following`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowingEvents(data.events);
        setFollowingOrganizers(data.organizers);
      }
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  // Buddy system functions
  const sendBuddyRequest = async (receiverId, receiverName) => {
    if (!authToken) {
      showInfoToast("Please login to send buddy requests");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/buddy-requests/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ receiverId, receiverName }),
      });

      if (response.ok) {
        showSuccessToast("Buddy request sent!");
        checkBuddyStatus(receiverId);
      } else {
        const data = await response.json();
        showInfoToast(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error sending buddy request:", error);
    }
  };

  const acceptBuddyRequest = async (requestId) => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/buddy-requests/accept/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        fetchPendingRequests();
        fetchBuddies();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const declineBuddyRequest = async (requestId) => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/buddy-requests/decline/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        fetchPendingRequests();
      }
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  const fetchPendingRequests = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/api/buddy-requests/pending`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchBuddies = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/api/buddy-requests/buddies`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBuddies(data);
      }
    } catch (error) {
      console.error("Error fetching buddies:", error);
    }
  };

  const checkBuddyStatus = async (otherUserId) => {
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/buddy-requests/status/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setBuddyStatus({ ...buddyStatus, [otherUserId]: data.status });
      }
    } catch (error) {
      console.error("Error checking buddy status:", error);
    }
  };

  const removeBuddy = async (requestId) => {
    if (!authToken) return;

    if (!window.confirm("Remove this buddy?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/buddy-requests/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        fetchBuddies();
      }
    } catch (error) {
      console.error("Error removing buddy:", error);
    }
  };

  // Social feed functions
  const fetchFeedPosts = async (phase = null) => {

    console.log('🔍 DEBUG - authToken:', authToken);
    console.log('🔍 authToken type:', typeof authToken);
    console.log('🔍 authToken truthy?:', !!authToken);
    console.log('🔍 DEBUG - localStorage:', localStorage.getItem('authToken'));

    try {
      setLoadingFeed(true);
      let url = `${API_URL}/api/feed-posts`;

      if (authToken) {
        url += `/personalized`;
      } else if (phase) {
        url += `?phase=${phase}`;
      }

      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      console.log('🔍 URL:', url);
      console.log('🔍 Headers:', headers);

      const response = await fetch(url, { headers });
      if (response.ok) {
        let data = await response.json();

        // Client-side filtering by event phase for accuracy
        if (phase) {
          data = data.filter((post) => {
            const event = events.find((e) => e.id === post.event_id);
            if (!event) return false;

            const eventDateTime = new Date(`${event.date}T${event.time}`);
            const now = new Date();
            const eventEndTime = new Date(
              eventDateTime.getTime() + 6 * 60 * 60 * 1000,
            ); // Assume 6hr duration

            if (phase === "live") {
              // Live: event has started but not ended
              return now >= eventDateTime && now <= eventEndTime;
            } else if (phase === "upcoming") {
              // Upcoming: event hasn't started yet
              return now < eventDateTime;
            } else if (phase === "past") {
              // Past: event has ended
              return now > eventEndTime;
            }
            return true;
          });
        }

        setFeedPosts(data);
       if (authToken) {
  // Only fetch reactions for posts we don't have yet
  data.forEach(post => {
    if (!feedReactions[post.id]) {
      fetchFeedReactions(post.id);
    }
  });
}
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const createFeedPost = async () => {
    if (!authToken) {
      showInfoToast("Please login to post");
      return;
    }

    if (!newFeedPost.eventId) {
      showInfoToast("Please select an event");
      return;
    }

    if (!newFeedPost.content && !newFeedPost.mediaUrl) {
      showInfoToast("Please add some content");
      return;
    }

    try {
      // Determine post type based on media
      let postType = "text";
      if (newFeedPost.mediaUrl) {
        postType = newFeedPost.postType || "photo";
      }

      // Determine event phase
      const event = events.find((e) => e.id === newFeedPost.eventId);
      let eventPhase = "upcoming";
      if (event) {
        const phase = getEventPhase(event);
        eventPhase =
          phase === "live" ? "live" : phase === "past" ? "past" : "upcoming";
      }

      const postData = {
        eventId: newFeedPost.eventId,
        eventTitle: newFeedPost.eventTitle,
        eventDate: newFeedPost.eventDate,
        eventLocation: newFeedPost.eventLocation,
        postType: postType,
        content: newFeedPost.content,
        mediaUrl: newFeedPost.mediaUrl || "",
        eventPhase: eventPhase,
        isCheckedIn: eventPhase === "live" ? true : false,
      };

      console.log("📤 Creating post:", postData);

      const response = await fetch(`${API_URL}/api/feed-posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const newPost = await response.json();
        console.log("✅ Post created successfully:", newPost);

        // Close composer and reset
        setShowPostComposer(false);
        setNewFeedPost({
          eventId: null,
          eventTitle: "",
          eventDate: "",
          eventLocation: "",
          content: "",
          mediaUrl: "",
          postType: "text",
          eventPhase: "upcoming",
        });
        setPostComposerEvent(null);

        // Refresh both feeds
        fetchFeedPosts(feedFilter === "all" ? null : feedFilter);

        // If we're on the event detail page, also refresh the event feed
        if (selectedEvent && selectedEvent.id === newFeedPost.eventId) {
          fetchPostsForEvent(selectedEvent.id);
        }

        showSuccessToast("Post shared successfully! 🎉");
      } else {
        const data = await response.json();
        console.error("❌ Post creation failed:", data);
        showErrorToast(data.error || data.message || "Failed to create post");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      showErrorToast("Failed to create post. Please check your connection.");
    }
  };

  const deleteFeedPost = async (postId) => {
    if (!authToken) return;

    if (!window.confirm("Delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/feed-posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        fetchFeedPosts(feedFilter === "all" ? null : feedFilter);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Feed interactions functions
 const handleFeedReaction = async (postId, reaction) => {
  try {
    const response = await fetch(`${API_URL}/api/feed-reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ post_id: postId, reaction_type: reaction })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add reaction');
    }

    const data = await response.json();
    console.log('Reaction response:', data);

    // ✅ Update post locally - NO page reload!
    setFeedPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          if (data.action === 'removed') {
            // Unlike
            return {
              ...post,
              reaction_count: Math.max(0, post.reaction_count - 1),
              user_reacted: false
            };
          } else {
            // Like
            return {
              ...post,
              reaction_count: post.reaction_count + 1,
              user_reacted: true
            };
          }
        }
        return post;
      })
    );

    return data;
  } catch (error) {
    console.error('Error adding feed reaction:', error);
    throw error;
  }
};

 const fetchFeedComments = async (postId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/feed-comments/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      setFeedComments((prev) => {
        // Only update if data actually changed
        if (JSON.stringify(prev[postId]) === JSON.stringify(data)) {
          return prev; // Return same reference to prevent re-render
        }
        return { ...prev, [postId]: data };
      });
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
};

  const fetchFeedReactions = async (postId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/feed-reactions/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      setFeedReactions((prev) => ({ ...prev, [postId]: data }));
    }
  } catch (error) {
    console.error("Error fetching reactions:", error);
  }
};

 const handleAddFeedComment = async (postId, parentCommentId = null) => {
  if (!authToken) {
    showInfoToast("Please login to comment");
    return;
  }

  const commentText = parentCommentId ? replyText : commentInputs[postId];
  
  if (!commentText?.trim()) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/feed-comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          post_id: postId,
          content: commentText.trim(),
          parent_comment_id: parentCommentId,
        }),
      },
    );

    if (response.ok) {
      const newComment = await response.json();
      
      // Clear the appropriate input
      if (parentCommentId) {
        setReplyText("");
        setReplyingToFeed(null);
      } else {
        setCommentInputs(prev => ({
          ...prev,
          [postId]: ''
        }));
        
        // Refocus the input after state update
        setTimeout(() => {
          if (commentInputRefs.current[postId]) {
            commentInputRefs.current[postId].focus();
          }
        }, 0);
      }
      
      // Fetch fresh comments instead of optimistic update
      fetchFeedComments(postId);
      
      // Update comment count
      setFeedPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comment_count: (post.comment_count || 0) + 1 }
            : post
        )
      );
      
      showSuccessToast(parentCommentId ? "Reply added!" : "Comment added!");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    showErrorToast("Failed to add comment");
  }
};

  // Toast notification functions
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000); // Auto-hide after 3 seconds
  };

  // Event Form Validation Functions
  const validateEventDate = (date) => {
    if (!date) return { valid: false, message: "Date is required" };

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate < today) {
      return { valid: false, message: "Event date cannot be in the past" };
    }

    return { valid: true, message: "" };
  };

  const validateEventTime = (time) => {
    if (!time) return { valid: false, message: "Time is required" };

    // Basic time format check (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return { valid: false, message: "Invalid time format" };
    }

    return { valid: true, message: "" };
  };

  const validateEventPrice = (price) => {
    if (!price || price.trim() === "") {
      return { valid: false, message: "Price is required" };
    }

    // Allow formats like: "KES 1,000", "Free", "$20", "1000"
    // Just check it's not empty for now - you can add stricter validation if needed

    return { valid: true, message: "" };
  };

  const validateEventForm = (eventData) => {
    const errors = {};

    // Title validation
    if (!eventData.title || eventData.title.trim() === "") {
      errors.title = "Event title is required";
    } else if (eventData.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (eventData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    // Date validation
    const dateValidation = validateEventDate(eventData.date);
    if (!dateValidation.valid) {
      errors.date = dateValidation.message;
    }

    // Time validation
    const timeValidation = validateEventTime(eventData.time);
    if (!timeValidation.valid) {
      errors.time = timeValidation.message;
    }

    // Location validation
    if (!eventData.location || eventData.location.trim() === "") {
      errors.location = "Location is required";
    } else if (eventData.location.length < 3) {
      errors.location = "Location must be at least 3 characters";
    }

    // Price validation
    const priceValidation = validateEventPrice(eventData.price);
    if (!priceValidation.valid) {
      errors.price = priceValidation.message;
    }

    // Category validation
    if (!eventData.category) {
      errors.category = "Category is required";
    }

    return errors;
  };

  // Form Validation Helper Functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  };

  const isFormValid = (formData, requiredFields) => {
    return requiredFields.every(
      (field) => formData[field] && formData[field].trim() !== "",
    );
  };

  const showSuccessToast = (message) => showToast(message, "success");
  const showErrorToast = (message) => showToast(message, "error");
  const showInfoToast = (message) => showToast(message, "info");

  // ============================================
  // MESSAGING HELPER FUNCTIONS
  // ============================================

  // Format timestamp in human-friendly way for inbox
  const formatMessageTime = (timestamp) => {
    const now = new Date();
    const msgDate = new Date(timestamp);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return msgDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get relative time for chat view timestamps
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const msgDate = new Date(timestamp);
    const diffMins = Math.floor((now - msgDate) / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return msgDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Check if messages should be grouped (within 5 minutes, same sender)
  const shouldGroupMessage = (currentMsg, prevMsg) => {
    if (!prevMsg || currentMsg.sender_id !== prevMsg.sender_id) return false;

    const currentTime = new Date(currentMsg.created_at);
    const prevTime = new Date(prevMsg.created_at);
    const diffMinutes = (currentTime - prevTime) / 60000;

    return diffMinutes < 5;
  };

  // ADD THESE HELPER FUNCTIONS HERE:
  const getEventPhase = (event) => {
    if (!event || !event.date || !event.time) return "upcoming";

    try {
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const now = new Date();
      const hoursDiff = (eventDateTime - now) / (1000 * 60 * 60);

      if (hoursDiff < 0 && hoursDiff > -6) return "live";
      if (hoursDiff >= 0 && hoursDiff <= 24) return "starting-soon";
      if (hoursDiff < 0) return "past";
      return "upcoming";
    } catch (error) {
      return "upcoming";
    }
  };

  const getDiscussionCount = (postId) => {
    const comments = feedComments[postId] || [];
    const reactions = feedReactions[postId] || {};
    const reactionCount = Object.values(reactions).reduce(
      (sum, arr) => sum + (arr?.length || 0),
      0,
    );
    return comments.length + reactionCount;
  };

  const getTrendingScore = (post) => {
    try {
      const ageInHours =
        (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60);
      const discussionCount = getDiscussionCount(post.id);
      return discussionCount / (ageInHours + 2);
    } catch (error) {
      return 0;
    }
  };

  // Get mutual buddies going to an event
  const getMutualBuddiesForEvent = async (eventId) => {
    if (!authToken || !user) return [];

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/mutual-buddies`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setMutualBuddies((prev) => ({
          ...prev,
          [eventId]: data.mutualBuddies || [],
        }));
        return data.mutualBuddies || [];
      }
    } catch (error) {
      console.error("Error fetching mutual buddies:", error);
    }
    return [];
  };

  // Get all buddies for current user (if not already loaded)
  const fetchAllBuddies = async () => {
    if (!authToken || buddies.length > 0) return;

    try {
      const response = await fetch(`${API_URL}/api/buddies`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBuddies(data.buddies || []);
      }
    } catch (error) {
      console.error("Error fetching buddies:", error);
    }
  };

  // Check which buddies are going to events (client-side for now)
  const calculateMutualBuddiesForEvents = (events) => {
    if (!user || buddies.length === 0) return;

    events.forEach((event) => {
      // Get attendees for this event from eventRSVPs
      const attendees = eventRSVPs[event.id]?.going || [];

      // Find mutual buddies
      const mutual = attendees.filter((attendee) =>
        buddies.some(
          (buddy) =>
            buddy.buddy_id === attendee.user_id ||
            buddy.user_id === attendee.user_id,
        ),
      );

      if (mutual.length > 0) {
        setMutualBuddies((prev) => ({ ...prev, [event.id]: mutual }));
      }
    });
  };

  // Get recent buddy activity
  // Get recent buddy activity (client-side version)
  const fetchBuddyActivity = async () => {
    if (!user || buddies.length === 0) {
      setBuddyActivity([]);
      return;
    }

    try {
      // Generate activity from existing eventRSVPs data
      const activity = [];

      // Loop through all events and check RSVPs
      Object.entries(eventRSVPs).forEach(([eventId, rsvps]) => {
        const event = events.find((e) => e.id === parseInt(eventId));
        if (!event) return;

        // Check each RSVP status
        ["going", "maybe", "not_going"].forEach((status) => {
          const rsvpList = rsvps[status] || [];

          rsvpList.forEach((attendee) => {
            // Check if this attendee is a buddy
            const isBuddy = buddies.some(
              (buddy) =>
                buddy.buddy_id === attendee.user_id ||
                buddy.user_id === attendee.user_id,
            );

            if (isBuddy && attendee.user_id !== user.id) {
              activity.push({
                user_name: attendee.user_name,
                user_id: attendee.user_id,
                event_title: event.title,
                event_id: event.id,
                rsvp_status: status,
                created_at: new Date().toISOString(), // Use current time as we don't have exact time
              });
            }
          });
        });
      });

      // Sort by most recent and limit to 20
      const sortedActivity = activity
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);

      setBuddyActivity(sortedActivity);
      console.log(
        "✅ Buddy activity loaded:",
        sortedActivity.length,
        "activities",
      );
    } catch (error) {
      console.error("Error generating buddy activity:", error);
      setBuddyActivity([]);
    }
  };

  // Apply filters to events
  const applyAdvancedFilters = (events, filters) => {
    let filtered = [...events];

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);

        if (filters.dateRange === "today") {
          return eventDate.toDateString() === today.toDateString();
        } else if (filters.dateRange === "weekend") {
          const nextSunday = new Date(today);
          nextSunday.setDate(today.getDate() + (7 - today.getDay()));
          const thisFriday = new Date(today);
          thisFriday.setDate(today.getDate() + (5 - today.getDay()));
          return eventDate >= thisFriday && eventDate <= nextSunday;
        } else if (filters.dateRange === "week") {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return eventDate >= today && eventDate <= nextWeek;
        } else if (filters.dateRange === "month") {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          return eventDate >= today && eventDate <= nextMonth;
        }
        return true;
      });
    }

    // Price range filter
    if (filters.priceRange !== "all") {
      filtered = filtered.filter((event) => {
        const price = event.price?.toLowerCase() || "";
        const numPrice = parseInt(price.replace(/[^0-9]/g, "")) || 0;

        if (filters.priceRange === "free") {
          return price.includes("free") || numPrice === 0;
        } else if (filters.priceRange === "under1000") {
          return numPrice > 0 && numPrice < 1000;
        } else if (filters.priceRange === "under5000") {
          return numPrice >= 1000 && numPrice < 5000;
        } else if (filters.priceRange === "premium") {
          return numPrice >= 5000;
        }
        return true;
      });
    }

    // Category filter (multi-select)
    if (filters.categories.length > 0) {
      filtered = filtered.filter((event) =>
        filters.categories.includes(event.category?.toLowerCase()),
      );
    }

    // Verified filter
    if (filters.verified) {
      filtered = filtered.filter((event) => event.verified === true);
    }

    // Distance filter (simulated - you can enhance with real geolocation)
    if (filters.distance === "nearby") {
      // For now, just a placeholder - you can add real distance calculation
      filtered = filtered.filter((event) =>
        event.location?.toLowerCase().includes("nairobi"),
      );
    }

    return filtered;
  };

  // Smart Recommendation Engine
  const generateRecommendations = (allEvents, userProfile) => {
    if (!user || allEvents.length === 0) return [];

    const scoredEvents = allEvents.map((event) => {
      let score = 0;
      let reasons = [];

      // 1. Category Match (user's past attendance)
      const attendedCategories = events
        .filter((e) => rsvpStatus[e.id] === "going")
        .map((e) => e.category?.toLowerCase())
        .filter(Boolean);

      if (attendedCategories.includes(event.category?.toLowerCase())) {
        score += 30;
        reasons.push(`You enjoy ${event.category} events`);
      }

      // 2. Organizer you follow
      if (isFollowing[`organizer-${event.organizer_id}`]) {
        score += 25;
        reasons.push(`From ${event.organizer} (following)`);
      }

      // 3. Popular with your buddies
      const buddiesGoing = mutualBuddies[event.id]?.length || 0;
      if (buddiesGoing > 0) {
        score += buddiesGoing * 15;
        reasons.push(
          `${buddiesGoing} ${buddiesGoing === 1 ? "buddy" : "buddies"} going`,
        );
      }

      // 4. High attendance (popularity)
      const attendanceScore = Math.min((event.attending || 0) / 10, 20);
      score += attendanceScore;
      if (event.attending > 50) {
        reasons.push("Trending event");
      }

      // 5. Verified organizer
      if (event.verified) {
        score += 10;
        reasons.push("Verified organizer");
      }

      // 6. Price preference (free events slightly boosted)
      if (event.price?.toLowerCase().includes("free")) {
        score += 5;
      }

      // 7. Timing preference (upcoming events within a week)
      const eventDate = new Date(event.date);
      const now = new Date();
      const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);

      if (daysUntil > 0 && daysUntil <= 7) {
        score += 15;
        reasons.push("Happening soon");
      }

      // 8. Events you've liked
      if (likedEvents.includes(event.id)) {
        score += 20;
      }

      // 9. Similar to events you're attending
      const attendingEvents = events.filter(
        (e) => rsvpStatus[e.id] === "going",
      );
      const hasSimilarAttending = attendingEvents.some(
        (e) =>
          e.category?.toLowerCase() === event.category?.toLowerCase() &&
          e.id !== event.id,
      );
      if (hasSimilarAttending) {
        score += 10;
      }

      // Exclude events already attending or past events
      if (rsvpStatus[event.id] === "going") {
        score = -1;
      }
      if (daysUntil < 0) {
        score = -1;
      }

      return {
        ...event,
        recommendationScore: score,
        recommendationReasons: reasons.slice(0, 2), // Top 2 reasons
      };
    });

    // Sort by score and return top 10
    return scoredEvents
      .filter((e) => e.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10);
  };

  // Update recommendations when relevant data changes
  const updateRecommendations = () => {
    if (!user) {
      setRecommendations([]);
      return;
    }

    const recs = generateRecommendations(events, user);
    setRecommendations(recs);

    // Store reasons
    const reasons = {};
    recs.forEach((rec) => {
      reasons[rec.id] = rec.recommendationReasons;
    });
    setRecommendationReason(reasons);

    console.log("✨ Generated", recs.length, "recommendations");
  };

  // Image Modal Component
  const ImageModal = ({ image, title, onClose }) => {
    if (!image) return null;

    return (
      <div
        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="max-w-7xl w-full">
          <img
            src={image}
            alt={title}
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-white text-center mt-4 text-lg font-semibold">
            {title}
          </p>
        </div>
      </div>
    );
  };

  // Event Status Badge Component
  const EventStatusBadge = ({ event }) => {
    const phase = getEventPhase(event);

    if (phase === "live") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full animate-ping absolute"></span>
          <span className="w-2 h-2 bg-white rounded-full relative"></span>
          <span>LIVE NOW</span>
        </div>
      );
    }

    if (phase === "starting-soon") {
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const now = new Date();
      const hoursUntil = Math.ceil((eventDateTime - now) / (1000 * 60 * 60));

      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
          <Clock className="w-3 h-3" />
          <span>STARTS IN {hoursUntil}H</span>
        </div>
      );
    }

    if (phase === "past") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-400 text-white text-xs font-bold rounded-full">
          <span>ENDED</span>
        </div>
      );
    }

    // Check if today
    const eventDate = new Date(event.date);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();

    if (isToday) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-full shadow-lg">
          <Calendar className="w-3 h-3" />
          <span>TODAY</span>
        </div>
      );
    }

    return null;
  };

  // Advanced Filters Modal Component
  const AdvancedFiltersModal = ({ show, onClose, filters, onApply }) => {
    const [tempFilters, setTempFilters] = useState(filters);

    if (!show) return null;

    const dateRanges = [
      { id: "all", name: "Any time", icon: "📅" },
      { id: "today", name: "Today", icon: "⚡" },
      { id: "weekend", name: "This weekend", icon: "🎉" },
      { id: "week", name: "This week", icon: "📆" },
      { id: "month", name: "This month", icon: "🗓️" },
    ];

    const priceRanges = [
      { id: "all", name: "Any price", icon: "💰" },
      { id: "free", name: "Free", icon: "🆓" },
      { id: "under1000", name: "Under KES 1,000", icon: "💵" },
      { id: "under5000", name: "Under KES 5,000", icon: "💳" },
      { id: "premium", name: "Premium (5000+)", icon: "💎" },
    ];

    const distances = [
      { id: "all", name: "Anywhere", icon: "🌍" },
      { id: "nearby", name: "Nearby (5km)", icon: "📍" },
      { id: "city", name: "Within Nairobi", icon: "🏙️" },
    ];

    const categories = [
      { id: "music", name: "Music", icon: "🎵" },
      { id: "sports", name: "Sports", icon: "⚽" },
      { id: "tech", name: "Tech", icon: "💻" },
      { id: "food", name: "Food & Drink", icon: "🍔" },
      { id: "arts", name: "Arts", icon: "🎨" },
      { id: "networking", name: "Networking", icon: "🤝" },
      { id: "education", name: "Education", icon: "📚" },
      { id: "health", name: "Health & Fitness", icon: "💪" },
      { id: "entertainment", name: "Entertainment", icon: "🎭" },
    ];

    const handleCategoryToggle = (categoryId) => {
      setTempFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(categoryId)
          ? prev.categories.filter((id) => id !== categoryId)
          : [...prev.categories, categoryId],
      }));
    };

    const clearAllFilters = () => {
      setTempFilters({
        dateRange: "all",
        priceRange: "all",
        categories: [],
        verified: false,
        distance: "all",
      });
    };

    const activeFilterCount =
      (tempFilters.dateRange !== "all" ? 1 : 0) +
      (tempFilters.priceRange !== "all" ? 1 : 0) +
      tempFilters.categories.length +
      (tempFilters.verified ? 1 : 0) +
      (tempFilters.distance !== "all" ? 1 : 0);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              {activeFilterCount > 0 && (
                <p className="text-sm text-gray-500">
                  {activeFilterCount} active
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Date Range */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">When</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dateRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() =>
                      setTempFilters({ ...tempFilters, dateRange: range.id })
                    }
                    className={`p-3 rounded-xl border-2 transition-all text-left ${tempFilters.dateRange === range.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="text-2xl mb-1">{range.icon}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {range.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Price</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() =>
                      setTempFilters({ ...tempFilters, priceRange: range.id })
                    }
                    className={`p-3 rounded-xl border-2 transition-all text-left ${tempFilters.priceRange === range.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="text-2xl mb-1">{range.icon}</div>
                    <div className="text-xs font-semibold text-gray-900">
                      {range.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${tempFilters.categories.includes(cat.id)
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-sm font-semibold">{cat.name}</span>
                    {tempFilters.categories.includes(cat.id) && (
                      <span className="text-indigo-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Distance</h3>
              <div className="grid grid-cols-3 gap-2">
                {distances.map((dist) => (
                  <button
                    key={dist.id}
                    onClick={() =>
                      setTempFilters({ ...tempFilters, distance: dist.id })
                    }
                    className={`p-3 rounded-xl border-2 transition-all text-left ${tempFilters.distance === dist.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="text-2xl mb-1">{dist.icon}</div>
                    <div className="text-xs font-semibold text-gray-900">
                      {dist.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempFilters.verified}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      verified: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    Verified events only
                  </div>
                  <div className="text-sm text-gray-500">
                    Show only events from verified organizers
                  </div>
                </div>
                <span className="text-2xl">✓</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-white sticky bottom-0">
            <div className="flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Clear all
              </button>
              <button
                onClick={() => {
                  onApply(tempFilters);
                  onClose();
                }}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mutual Buddies Badge Component
  const MutualBuddiesBadge = ({ eventId, compact = false }) => {
    const mutual = mutualBuddies[eventId] || [];

    if (mutual.length === 0) return null;

    if (compact) {
      // Compact version for cards
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-1.5 rounded-full border border-purple-200">
          <div className="flex -space-x-2">
            {mutual.slice(0, 3).map((buddy, idx) => (
              <div
                key={idx}
                className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white"
              >
                {getInitial(buddy.user_name)}
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-purple-700">
            {mutual.length === 1
              ? `${mutual[0].user_name?.split(" ")[0]} is going`
              : mutual.length === 2
                ? `${mutual[0].user_name?.split(" ")[0]} & ${mutual[1].user_name?.split(" ")[0]} are going`
                : `${mutual[0].user_name?.split(" ")[0]}, ${mutual[1].user_name?.split(" ")[0]} & ${mutual.length - 2} ${mutual.length - 2 === 1 ? "other" : "others"}`}
          </span>
        </div>
      );
    }

    // Expanded version for detail page
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl">
            👥
          </div>
          <div>
            <div className="font-bold text-purple-900">
              {mutual.length} {mutual.length === 1 ? "buddy" : "buddies"} going
            </div>
            <div className="text-sm text-purple-600">People you know</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mutual.slice(0, 5).map((buddy, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-purple-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">

                {getInitial(buddy.user_name)}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {buddy.user_name?.split(" ")[0]}
              </span>
            </div>
          ))}
          {mutual.length > 5 && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-purple-200">
              <span className="text-sm font-semibold text-purple-700">
                +{mutual.length - 5} more
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Buddy Activity Feed Modal
  const BuddyActivityModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>👥</span>
                Buddy Activity
              </h2>
              <p className="text-sm text-gray-600">
                See what your friends are up to
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto">
            {buddyActivity.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="font-bold text-gray-900 mb-2">
                  No activity yet
                </h3>
                <p className="text-gray-600">
                  When your buddies RSVP to events, you'll see their activity
                  here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {buddyActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">

                        {getInitial(activity.user_name)}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">
                          <span className="font-bold text-gray-900">
                            {activity.user_name}
                          </span>
                          <span className="text-gray-600"> is </span>
                          <span
                            className={`font-bold ${activity.rsvp_status === "going"
                              ? "text-green-600"
                              : activity.rsvp_status === "maybe"
                                ? "text-yellow-600"
                                : "text-gray-600"
                              }`}
                          >
                            {activity.rsvp_status === "going"
                              ? "going"
                              : activity.rsvp_status === "maybe"
                                ? "interested"
                                : "not going"}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {activity.event_title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const event = events.find(
                            (e) => e.id === activity.event_id,
                          );
                          if (event) {
                            setSelectedEvent(event);
                            setView("event-detail");
                            onClose();
                          }
                        }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold hover:bg-indigo-200 transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Recommendation Card Component
  const RecommendationCard = ({ event, reasons }) => {
    return (
      <div
        onClick={() => {
          setSelectedEvent(event);
          setView("event-detail");
          if (user) {
            fetchUserRSVP(event.id);
            checkIsFollowing("event", event.id);
            if (event.organizer_id) {
              checkIsFollowing("organizer", event.organizer_id);
            }
            getMutualBuddiesForEvent(event.id);
          }
          fetchEventRSVPs(event.id);
          fetchFollowerCount("event", event.id);
        }}
        className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer group transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative"
      >
        {/* Recommended Badge */}
        <div className="absolute top-3 right-3 z-20 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1">
          <span>⭐</span>
          <span>For You</span>
        </div>

        {/* Event Image */}
        <div className="relative h-40 overflow-hidden bg-gray-900">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
          />

          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-20">
            <EventStatusBadge event={event} />
          </div>

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Recommendation Reasons */}
          {reasons && reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {reasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-2 py-1 rounded-full font-semibold border border-purple-200"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <Users className="w-4 h-4" />
            <span>{event.attending} going</span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (user) {
                  handleRSVP(event.id, "going");
                  showSuccessToast(`Added to your events!`);
                } else {
                  showInfoToast("Please login to RSVP");
                  setView("login");
                }
              }}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
            >
              Interested
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike(event.id);
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              <Heart
                className={`w-5 h-5 ${likedEvents.includes(event.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pull-to-Refresh Component
  const PullToRefresh = ({ onRefresh, children }) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleTouchStart = (e) => {
      // Only trigger if user is at the top of the page
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;

      const touch = e.touches[0];
      const pullDistance = Math.max(0, Math.min(touch.clientY - startY, 120));
      setCurrentY(pullDistance);
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      if (currentY > 80) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }

      setCurrentY(0);
    };

    const rotation = Math.min((currentY / 80) * 360, 360);
    const opacity = Math.min(currentY / 80, 1);

    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        {/* Pull Indicator */}
        {(isPulling || isRefreshing) && (
          <div
            className="absolute top-0 left-0 right-0 flex justify-center items-center transition-all"
            style={{
              height: `${currentY}px`,
              opacity: opacity,
            }}
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              {isRefreshing ? (
                <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-6 h-6 text-indigo-600 transition-transform"
                  style={{ transform: `rotate(${rotation}deg)` }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
            </div>
            {!isRefreshing && currentY > 80 && (
              <div className="absolute top-full mt-2 text-sm text-gray-600 font-semibold">
                Release to refresh
              </div>
            )}
          </div>
        )}

        <div
          style={{
            transform: `translateY(${isRefreshing ? "60px" : "0"})`,
            transition: "transform 0.3s",
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  // Lazy Loading Image Component
  const LazyImage = ({ src, alt, className, onClick }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: "50px" },
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={imgRef}
        className={`${className} relative bg-gray-200`}
        onClick={onClick}
      >
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
        )}
        {isInView && (
          <img
            src={src}
            alt={alt}
            className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        )}
      </div>
    );
  };

  // Scroll to Top Button
  const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      };

      window.addEventListener("scroll", toggleVisibility);
      return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    return (
      <>
        {isVisible && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </>
    );
  };

  // Discovery Section Component for My Events
  const DiscoverySection = ({
    title,
    icon,
    events: discoveryEvents,
    emptyText,
  }) => {
    if (discoveryEvents.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {title}
          </h3>
          <button
            onClick={() => setView("explore")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            See all →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {discoveryEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                setSelectedEvent(event);
                setView("event-detail");
                if (user) {
                  fetchUserRSVP(event.id);
                  checkIsFollowing("event", event.id);
                  if (event.organizer_id) {
                    checkIsFollowing("organizer", event.organizer_id);
                  }
                  getMutualBuddiesForEvent(event.id);
                }
                fetchEventRSVPs(event.id);
                fetchFollowerCount("event", event.id);
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex gap-3">
                {/* Event Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{event.attending} attending</span>
                  </div>
                </div>

                {/* Quick Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRSVP(event.id, "going");
                    showSuccessToast("Added to your events!");
                  }}
                  className="self-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Join
                </button>
              </div>

              {/* Mutual Buddies Badge */}
              {mutualBuddies[event.id] &&
                mutualBuddies[event.id].length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-purple-700">
                      <div className="flex -space-x-2">
                        {mutualBuddies[event.id]
                          .slice(0, 3)
                          .map((buddy, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white"
                            >

                              {getInitial(buddy.user_name)}
                            </div>
                          ))}
                      </div>
                      <span className="font-semibold">
                        {mutualBuddies[event.id].length}{" "}
                        {mutualBuddies[event.id].length === 1
                          ? "buddy"
                          : "buddies"}{" "}
                        going
                      </span>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Login View
  // Login View - Two Column Layout

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ToastNotification />

        {/* Left Column - Cover Image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-indigo-800 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80"
              alt="Event atmosphere"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/50 to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-end p-12 text-white">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-indigo-600" />
                </div>
                <h1 className="text-4xl font-bold">Happening</h1>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Welcome back to your events
              </h2>
              <p className="text-lg text-indigo-100 leading-relaxed">
                Connect with your community, discover events, and make memories
                that matter.
              </p>
            </div>

            <div className="flex items-center gap-8 text-sm text-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Live Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Real Connections</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Local Community</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Happening</h1>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back To Happening
              </h2>
              <p className="text-gray-600 mb-8">
                Log in to continue to your events
              </p>

              {authError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, email: e.target.value });
                      if (loginErrors.email) {
                        setLoginErrors({ ...loginErrors, email: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 border ${loginErrors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 ${loginErrors.email ? "focus:ring-red-500" : "focus:ring-indigo-500"}`}
                    placeholder="you@example.com"
                    required
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authForm.password}
                      onChange={(e) => {
                        setAuthForm({ ...authForm, password: e.target.value });
                        if (loginErrors.password) {
                          setLoginErrors({ ...loginErrors, password: "" });
                        }
                      }}
                      className={`w-full px-4 py-3 pr-12 border ${loginErrors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 ${loginErrors.password ? "focus:ring-red-500" : "focus:ring-indigo-500"}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordView(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>

                {/* Social Login Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => showInfoToast("Google login coming soon!")}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={() => showInfoToast("Facebook login coming soon!")}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setView("signup");
                    setAuthError("");
                    setLoginErrors({});
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal - Keep existing */}
        {forgotPasswordView && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reset Password
                </h2>
                <button
                  onClick={() => {
                    setForgotPasswordView(false);
                    setResetEmailSent(false);
                    setForgotPasswordEmail("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!resetEmailSent ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We've sent a password reset link to{" "}
                    <strong>{forgotPasswordEmail}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setForgotPasswordView(false);
                      setResetEmailSent(false);
                      setForgotPasswordEmail("");
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  // Signup View
  // Signup View - Two Column Layout
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "signup") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ToastNotification />

        {/* Left Column - Cover Image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-indigo-800 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80"
              alt="Event atmosphere"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/50 to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-end p-12 text-white">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-indigo-600" />
                </div>
                <h1 className="text-4xl font-bold">Happening</h1>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Join your community today
              </h2>
              <p className="text-lg text-indigo-100 leading-relaxed">
                Create events, build connections, and be part of something
                bigger.
              </p>
            </div>

            <div className="flex items-center gap-8 text-sm text-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Real People</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Signup Form */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md py-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Happening</h1>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h2>
              <p className="text-gray-600 mb-8">
                Join thousands of event-goers and organizers
              </p>

              {authError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{authError}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, name: e.target.value });
                      if (signupErrors.name) {
                        setSignupErrors({ ...signupErrors, name: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 border ${signupErrors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 ${signupErrors.name ? "focus:ring-red-500" : "focus:ring-indigo-500"}`}
                    placeholder="John Doe"
                    required
                  />
                  {signupErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {signupErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, email: e.target.value });
                      if (signupErrors.email) {
                        setSignupErrors({ ...signupErrors, email: "" });
                      }
                    }}
                    onBlur={() => {
                      if (authForm.email && !validateEmail(authForm.email)) {
                        setSignupErrors({
                          ...signupErrors,
                          email: "Please enter a valid email address",
                        });
                      }
                    }}
                    className={`w-full px-4 py-3 border ${signupErrors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 ${signupErrors.email ? "focus:ring-red-500" : "focus:ring-indigo-500"}`}
                    placeholder="you@example.com"
                    required
                  />
                  {signupErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {signupErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authForm.password}
                      onChange={(e) => {
                        setAuthForm({ ...authForm, password: e.target.value });
                        if (signupErrors.password) {
                          setSignupErrors({ ...signupErrors, password: "" });
                        }
                      }}
                      className={`w-full px-4 py-3 pr-12 border ${signupErrors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 ${signupErrors.password ? "focus:ring-red-500" : "focus:ring-indigo-500"}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {authForm.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-2 h-2 rounded-full ${validatePassword(authForm.password).length ? "bg-green-500" : "bg-gray-300"}`}
                        ></div>
                        <span
                          className={
                            validatePassword(authForm.password).length
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-2 h-2 rounded-full ${validatePassword(authForm.password).hasUpper ? "bg-green-500" : "bg-gray-300"}`}
                        ></div>
                        <span
                          className={
                            validatePassword(authForm.password).hasUpper
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-2 h-2 rounded-full ${validatePassword(authForm.password).hasNumber ? "bg-green-500" : "bg-gray-300"}`}
                        ></div>
                        <span
                          className={
                            validatePassword(authForm.password).hasNumber
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          One number
                        </span>
                      </div>
                    </div>
                  )}

                  {signupErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {signupErrors.password}
                    </p>
                  )}
                </div>

                {/* NEW: Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (signupErrors.confirmPassword) {
                          setSignupErrors({
                            ...signupErrors,
                            confirmPassword: "",
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 pr-12 border ${signupErrors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 ${signupErrors.confirmPassword ? "focus:ring-red-500" : "focus:ring-indigo-500"}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {signupErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {signupErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>

                {/* Social Login Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => showInfoToast("Google signup coming soon!")}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      showInfoToast("Facebook signup coming soon!")
                    }
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setView("login");
                    setAuthError("");
                    setSignupErrors({});
                    setConfirmPassword("");
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Social Feed View (Main Screen)
  // Discover View (Main Screen)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "discover") {
    const handleRefresh = async () => {
      await Promise.all([
        fetchFeedPosts(),
        fetchEvents(),
        user ? fetchConversations() : Promise.resolve(),
        user ? fetchPendingRequests() : Promise.resolve(),
      ]);
      showSuccessToast("Feed refreshed!");
    };

    return (
      <>
        <ToastNotification />

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header - Clean white with minimal indigo accent */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Happening
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    {user ? (
                      <>
                        <button
                          onClick={() => {
                            setView("messages");
                            fetchConversations();
                          }}
                          className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Messages"
                        >
                          <MessageCircle className="w-6 h-6 text-gray-700" />
                          {conversations.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {conversations.length}
                            </span>
                          )}
                        </button>

                        {/* ADD BUDDY ACTIVITY BUTTON HERE
                      {user && buddies.length > 0 && (
                        <button
                          onClick={() => {
                            fetchBuddyActivity();
                            setShowBuddyActivity(true);
                          }}
                          className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Buddy Activity"
                        >
                          <Users className="w-6 h-6 text-gray-700" />
                          {buddyActivity.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {buddyActivity.length > 9 ? '9+' : buddyActivity.length}
                            </span>
                          )}
                        </button>
                      )} */}

                        <button
                          onClick={() => {
                            showInfoToast("Notifications feature coming soon!");
                          }}
                          className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Notifications"
                        >
                          <svg
                            className="w-6 h-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {unreadNotifications}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setView("buddies");
                            fetchBuddies();
                            fetchPendingRequests();
                          }}
                          className="relative p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Buddies"
                        >
                          <svg
                            className="w-6 h-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          {pendingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-badge">
                              {pendingRequests.length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setView("profile")}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                            {user.name}
                          </span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                          title="Logout"
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setView("login")}
                          className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all font-medium"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => setView("signup")}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Feed Filters - Active state uses charcoal */}
            <div className="bg-white border-b sticky top-[73px] z-40">
              <div className="max-w-4xl mx-auto px-4">
                <div className="flex gap-2 py-3 overflow-x-auto">
                  <button
                    onClick={() => {
                      setFeedFilter("all");
                      fetchFeedPosts();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${feedFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    For You
                  </button>
                  <button
                    onClick={() => {
                      setFeedFilter("live");
                      fetchFeedPosts("live");
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${feedFilter === "live"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    🔴 Live Now
                  </button>

                  <button
                    onClick={() => {
                      setFeedFilter("upcoming");
                      fetchFeedPosts("upcoming");
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${feedFilter === "upcoming"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => {
                      setFeedFilter("past");
                      fetchFeedPosts("past");
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${feedFilter === "past"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                  >
                    Memories
                  </button>
                </div>
              </div>
            </div>

            {/* Post Composer Button - Expressive */}
            {user && (
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <button
                    onClick={() => setShowPostComposer(true)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">

                          {getInitial(user.name)}
                        </div>
                      )}
                      <span className="text-gray-500 flex-1">
                        What's happening at your event?
                      </span>
                    </div>
                  </button>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <button
                      onClick={() => setShowPostComposer(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Photo
                    </button>

                    <button
                      onClick={() => setShowPostComposer(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      Event
                    </button>

                    <button
                      onClick={() => setShowPostComposer(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <span className="w-5 h-5 flex items-center justify-center text-red-600 text-lg">
                        🔴
                      </span>
                      Live Update
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {user && recommendations.length > 0 && showRecommendations && (
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 border-b border-purple-100">
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Recommended For You
                        </h2>
                        <p className="text-sm text-gray-600">
                          Based on your interests and activity
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowRecommendations(false)}
                      className="p-2 hover:bg-white rounded-full transition-all"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Horizontal Scrollable Recommendations */}
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {recommendations.map((event) => (
                      <div key={event.id} className="flex-shrink-0 w-72">
                        <RecommendationCard
                          event={event}
                          reasons={recommendationReason[event.id]}
                        />
                      </div>
                    ))}

                    {/* See All Card */}
                    <div
                      onClick={() => setView("explore")}
                      className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer group border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-all"
                    >
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-all">
                          <Search className="w-8 h-8 text-indigo-600 group-hover:text-white transition-all" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          Explore More Events
                        </h3>
                        <p className="text-sm text-gray-500">
                          Discover hundreds of events in Nairobi
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        updateRecommendations();
                        showSuccessToast("Recommendations refreshed!");
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2 mx-auto"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh recommendations
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feed Posts */}
            <div className="max-w-4xl mx-auto px-4 pb-6">
              {loadingFeed ? (
                <div className="space-y-4">
                  <SkeletonCard />
                </div>
              ) : feedPosts.length === 0 ? (
                <FeedEmptyState
                  onCreatePost={() => setShowPostComposer(true)}
                />
              ) : (
                <div className="space-y-4">
                  {feedPosts.map((post) => {
                    const event = events.find(e => e.id === post.event_id);
                    return (
                      <div
                        key={post.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"

                      >
                        {/* Post Header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              onClick={() => {
                                setView("profile");
                              }}
                              className="cursor-pointer flex-shrink-0"
                            >
                              {post.user_id === user?.id &&
                                user?.profile_picture ? (
                                <img
                                  src={user.profile_picture}
                                  alt={post.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-indigo-400 transition-all"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold hover:bg-gray-300 transition-all">

                                  {getInitial(post.name)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                  onClick={() => {
                                    setView("profile");
                                  }}
                                  className="font-bold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                  {post.name}
                                </h3>

                                {/* Live Badge */}
                                {post.event_phase === "live" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200 animate-pulse">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    LIVE NOW
                                  </span>
                                )}

                                {/* Starting Soon Badge */}
                                {post.event_phase === "starting-soon" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full border border-orange-200">
                                    <Clock className="w-3 h-3" />
                                    STARTING SOON
                                  </span>
                                )}

                                {/* Trending Badge */}
                                {getTrendingScore(post) > 5 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-200">
                                    <TrendingUp className="w-3 h-3" />
                                    TRENDING
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500">
                                  {new Date(post.created_at).toLocaleString()}
                                </p>

                                {/* Discussion Count */}
                                {getDiscussionCount(post.id) > 0 && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-gray-600 font-medium">
                                      {getDiscussionCount(post.id)}{" "}
                                      {getDiscussionCount(post.id) === 1
                                        ? "person"
                                        : "people"}{" "}
                                      discussing
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            {user && user.name === post.name && (
                              <button
                                onClick={() => deleteFeedPost(post.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>

                          {/* Post Content */}
                          {post.content && (
                            <p className="mt-3 text-gray-900 whitespace-pre-wrap">
                              {post.content}
                            </p>
                          )}

                          {/* Post Media */}
                          {(post.media_url || post.image) && (
                            <div className="mt-3">
                              {post.post_type === "video" ? (
                                <video
                                  controls
                                  className="w-full rounded-lg max-h-96"
                                  onError={(e) => {
                                    console.error("Video load error:", e);
                                    showErrorToast("Failed to load video");
                                  }}
                                >
                                  <source src={(post.media_url || post.image)} type="video/mp4" />
                                  <source
                                    src={(post.media_url || post.image)}
                                    type="video/webm"
                                  />
                                  Your browser does not support video playback.
                                </video>
                              ) : (
                                <img
                                  src={(post.media_url || post.image)}
                                  alt="Post media"
                                  className="w-full rounded-lg max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error("Image load error:", e);
                                    e.target.src =
                                      "https://via.placeholder.com/800x400?text=Image+Not+Available";
                                    showErrorToast("Failed to load image");
                                  }}
                                  onClick={() => {
                                    setModalImage((post.media_url || post.image));
                                    setModalEventTitle(
                                      post.name + "'s post",
                                    );
                                    
                                    setShowImageModal(true);
                                  }}
                                />
                              )}
                            </div>
                          )}

                          {/* Event Context Card - Enhanced */}
                          <div
                            onClick={() => {
                              const event = events.find(
                                (e) => e.id === post.event_id,
                              );
                              if (event) {
                                setSelectedEvent(event);
                                setView("event-detail");
                                if (user) {
                                  fetchUserRSVP(event.id);
                                  checkIsFollowing("event", event.id);
                                  if (event.organizer_id) {
                                    checkIsFollowing(
                                      "organizer",
                                      event.organizer_id,
                                    );
                                  }
                                }
                                fetchEventRSVPs(event.id);
                                fetchFollowerCount("event", event.id);
                              }
                            }}
                            className="mt-3 group cursor-pointer"
                          >
                            <div className="relative bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-xl border-2 border-indigo-100 p-4 hover:border-indigo-300 hover:shadow-md transition-all">
                              {/* Top: Event Title + Phase Badge */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                      {post.event_title}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const event = events.find(
                                          (e) => e.id === post.event_id,
                                        );
                                        const phase = event
                                          ? getEventPhase(event)
                                          : "upcoming";

                                        if (phase === "live") {
                                          return (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                              LIVE
                                            </span>
                                          );
                                        } else if (phase === "starting-soon") {
                                          return (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                              <Clock className="w-3 h-3" />
                                              SOON
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                {/* Arrow indicator */}
                                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                                  <svg
                                    className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              </div>

                              {/* Bottom: Event Details */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 font-medium">
                                      Date
                                    </p>
                                    <p className="font-semibold">
                                      {new Date(
                                        post.event_date,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 font-medium">
                                      Location
                                    </p>
                                    <p className="font-semibold truncate">
                                      {post.event_location}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Attendee Count */}
                              {(() => {
                                const event = events.find(
                                  (e) => e.id === post.event_id,
                                );
                                const attendeeCount = event?.attendees || 0;
                                if (attendeeCount > 0) {
                                  return (
                                    <div className="mt-3 pt-3 border-t border-indigo-100">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                        <span className="font-semibold text-gray-900">
                                          {attendeeCount}
                                        </span>
                                        <span className="text-gray-600">
                                          {attendeeCount === 1
                                            ? "person"
                                            : "people"}{" "}
                                          attending
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* View Event CTA */}
                              <div className="mt-3 pt-3 border-t border-indigo-100">
                                <div className="flex items-center justify-between text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                                  <span>View Event Details</span>
                                  <svg
                                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                         
                          {/* Engagement Stats Bar - Prominent */}
                          {(() => {
                            const reactions = feedReactions[post.id] || {};
                            const totalReactions = Object.values(
                              reactions,
                            ).reduce((sum, arr) => sum + (arr?.length || 0), 0);
                            const comments = feedComments[post.id] || [];
                            const totalComments = comments.length;

                            return (
                              <>
                                {/* Stats Summary */}
                                {(totalReactions > 0 || totalComments > 0) && (
                                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600 px-1">
                                    {totalReactions > 0 && (
                                      <div className="flex items-center gap-1">
                                        <div className="flex -space-x-1">
                                          {reactions.like?.length > 0 && (
                                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center border border-white">
                                              <span className="text-xs">❤️</span>
                                            </div>
                                          )}
                                          {reactions.recommend?.length > 0 && (
                                            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center border border-white">
                                              <Share2 className="w-3 h-3 text-indigo-600" />
                                            </div>
                                          )}
                                        </div>
                                        <span className="font-semibold text-gray-700">
                                          {totalReactions}
                                        </span>
                                      </div>
                                    )}

                                    {totalComments > 0 && (
                                      <button
                                        onClick={() => {
                                          setShowFeedComments({
                                            ...showFeedComments,
                                            [post.id]: !showFeedComments[post.id],
                                          });
                                          if (!feedComments[post.id]) {
                                            fetchFeedComments(post.id);
                                          }
                                        }}
                                        className="text-gray-600 hover:text-gray-900 font-medium"
                                      >
                                        {totalComments}{" "}
                                        {totalComments === 1
                                          ? "comment"
                                          : "comments"}
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons with Clear Labels */}
<div className="mt-3 flex items-center gap-1 pt-3 border-t">
  {/* Like Button */}
  <button
    onClick={() => {
      handleFeedReaction(post.id, "like");
    }}
    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
      post.user_reacted
        ? "bg-red-50 text-red-600"
        : "hover:bg-gray-50 text-gray-700"
    }`}
  >
    <Heart
      className={`w-5 h-5 ${
        post.user_reacted
          ? "fill-red-500 text-red-500"
          : ""
      }`}
    />
    <span className="text-sm font-semibold">
      {post.reaction_count > 0
        ? `Like · ${post.reaction_count}`
        : "Like"}
    </span>
  </button>

  {/* Comment Button */}
  <button
    onClick={() => {
      setShowFeedComments({
        ...showFeedComments,
        [post.id]: !showFeedComments[post.id],
      });
      if (!feedComments[post.id]) {
        fetchFeedComments(post.id);
      }
    }}
    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-gray-700"
  >
    <MessageCircle className="w-5 h-5" />
    <span className="text-sm font-semibold">
      {post.comment_count > 0
        ? `Comment · ${post.comment_count}`
        : "Comment"}
    </span>
  </button>

  {/* Share/Recommend Button */}
  <button
    onClick={() => {
      // Share functionality - you can implement this later
      showInfoToast("Share feature coming soon!");
    }}
    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-gray-700"
  >
    <Share2 className="w-5 h-5" />
    <span className="text-sm font-semibold">Share</span>
  </button>
</div>
                                

                                {/* Comment Preview (before full comments section) */}
                                {!showFeedComments[post.id] &&
                                  feedComments[post.id]?.length > 0 && (
                                    <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-xs flex-shrink-0">
                                          {getInitial(feedComments[post.id]?.[0]?.user_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-gray-900">
                                            <span className="font-semibold">
                                              {feedComments[post.id][0].user_name}
                                            </span>{" "}
                                            <span className="text-gray-700 line-clamp-1">
                                              {feedComments[post.id][0].content}
                                            </span>
                                          </p>
                                          {feedComments[post.id].length > 1 && (
                                            <button
                                              onClick={() => {
                                                setShowFeedComments({
                                                  ...showFeedComments,
                                                  [post.id]: true,
                                                });
                                              }}
                                              className="text-xs text-gray-600 hover:text-gray-900 font-medium mt-1"
                                            >
                                              View{" "}
                                              {feedComments[post.id].length > 2
                                                ? `all ${feedComments[post.id].length}`
                                                : "1 more"}{" "}
                                              comment
                                              {feedComments[post.id].length > 2
                                                ? "s"
                                                : ""}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </>
                            );
                          })()}

                         
                            {/* Comments Section */}
{showFeedComments[post.id] && (
  <div className="mt-3 border-t pt-3 space-y-3">
 {/* Add Comment Input - WITH SEND BUTTON */}
{user && (
  <CommentInput
    postId={post.id}
    onSubmit={(postId) => {
      fetchFeedComments(postId);
      setFeedPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, comment_count: (p.comment_count || 0) + 1 }
            : p
        )
      );
    }}
    authToken={authToken}
    API_URL={API_URL}
    showInfoToast={showInfoToast}
    showSuccessToast={showSuccessToast}
    showErrorToast={showErrorToast}
  />
)}

    {/* Comments List */}
    {feedComments[post.id]?.map((comment) => (
      <div key={comment.id}>
        {/* Parent Comment */}
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
            {getInitial(comment.name)}
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {comment.name}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleTimeString()}
              </span>
              {user && user.name === comment.name && (
                <button
                  onClick={() => handleDeleteFeedComment(comment.id, post.id)}
                  className="text-red-600 hover:text-red-800 text-xs ml-auto"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-sm text-gray-900">
              {comment.content}
            </p>
            {user && (
              <button
                onClick={() => setReplyingToFeed(comment.id)}
                className="text-xs text-gray-900 hover:text-indigo-700 font-medium mt-1"
              >
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Reply Input - WITH SEND BUTTON */}
       {/* Reply Input - WITH SEND BUTTON */}
{replyingToFeed === comment.id && (
  <div className="ml-10 mt-2 flex gap-2">
    <input
      type="text"
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === "Enter" && replyText.trim()) {
          handleAddFeedComment(post.id, comment.id);
        }
      }}
      placeholder="Write a reply..."
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      autoFocus
    />
    <button
      onClick={() => handleAddFeedComment(post.id, comment.id)}
      disabled={!replyText.trim()}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <Send className="w-4 h-4" />
      <span className="hidden sm:inline">Reply</span>
    </button>
    <button
      onClick={() => {
        setReplyingToFeed(null);
        setReplyText('');
      }}
      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
    >
      Cancel
    </button>
  </div>
)}

{/* Replies - FIXED to use reply.name */}
{comment.replies?.map((reply) => (
  <div key={reply.id} className="ml-10 mt-2 flex gap-2">
    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
      {getInitial(reply.name)}
    </div>
    <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-gray-900">
          {reply.name}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(reply.created_at).toLocaleTimeString()}
        </span>
        {user && user.name === reply.name && (
          <button
            onClick={() => handleDeleteFeedComment(reply.id, post.id)}
            className="text-red-600 hover:text-red-800 text-xs ml-auto"
          >
            Delete
          </button>
        )}
      </div>
      <p className="text-sm text-gray-900">
        {reply.content}
      </p>
    </div>
  </div>
))}

      </div>
    ))}
  </div>
)}
{/* Comments List */}
{feedComments[post.id]?.map((comment) => (
  <div key={comment.id}>
    {/* Parent Comment */}
    <div className="flex gap-2">
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
        {getInitial(comment.name)}
      </div>
      <div className="flex-1 bg-gray-50 rounded-lg p-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900">
            {comment.name}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleTimeString()}
          </span>
          {user && user.name === comment.name && (
            <button
              onClick={() => handleDeleteFeedComment(comment.id, post.id)}
              className="text-red-600 hover:text-red-800 text-xs ml-auto"
            >
              Delete
            </button>
          )}
        </div>
        <p className="text-sm text-gray-900">
          {comment.content}
        </p>
        {user && (
          <button
            onClick={() => {
              setReplyingToFeed(comment.id);
              setReplyText('');
            }}
            className="text-xs text-gray-900 hover:text-indigo-700 font-medium mt-1"
          >
            Reply
          </button>
        )}
      </div>
    </div>

    {/* Reply Input - UPDATED TO USE replyText */}
    {replyingToFeed === comment.id && (
      <div className="ml-10 mt-2 flex gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && replyText.trim()) {
              handleAddFeedComment(post.id, comment.id);
            }
          }}
          placeholder="Write a reply..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          autoFocus
        />
        <button
          onClick={() => handleAddFeedComment(post.id, comment.id)}
          disabled={!replyText.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Reply</span>
        </button>
        <button
          onClick={() => {
            setReplyingToFeed(null);
            setReplyText('');
          }}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    )}

    {/* Replies - FIXED to use reply.name instead of reply.user_name */}
    {comment.replies?.map((reply) => (
      <div key={reply.id} className="ml-10 mt-2 flex gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
          {getInitial(reply.name)}
        </div>
        <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {reply.name}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(reply.created_at).toLocaleTimeString()}
            </span>
            {user && user.name === reply.name && (
              <button
                onClick={() => handleDeleteFeedComment(reply.id, post.id)}
                className="text-red-600 hover:text-red-800 text-xs ml-auto"
              >
                Delete
              </button>
            )}
          </div>
          <p className="text-sm text-gray-900">
            {reply.content}
          </p>
        </div>
      </div>
    ))}
  </div>
))}
                            </div>
                        
                        </div>
                    
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </PullToRefresh>

        {/* Enhanced Post Composer Modal */}
        {showPostComposer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mt-20 mb-20">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
                <button
                  onClick={() => {
                    setShowPostComposer(false);
                    setNewFeedPost({
                      eventId: null,
                      eventTitle: "",
                      eventDate: "",
                      eventLocation: "",
                      content: "",
                      mediaUrl: "",
                      postType: "text",
                      eventPhase: "upcoming",
                    });
                    setPostComposerEvent(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">

                      {getInitial(user?.name)}

                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">Posting to feed</p>
                  </div>
                </div>

                {/* Content Input */}
                <textarea
                  value={newFeedPost.content}
                  onChange={(e) =>
                    setNewFeedPost({ ...newFeedPost, content: e.target.value })
                  }
                  placeholder="What's happening at your event?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-lg"
                  rows="4"
                />

                {/* Media Preview */}
                {newFeedPost.mediaUrl && (
                  <div className="mt-3 relative">
                    <img
                      src={newFeedPost.mediaUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() =>
                        setNewFeedPost({
                          ...newFeedPost,
                          mediaUrl: "",
                          postType: "text",
                        })
                      }
                      className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Event Selector with Search */}
                {postComposerEvent ? (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {postComposerEvent.title}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setPostComposerEvent(null);
                          setNewFeedPost({
                            ...newFeedPost,
                            eventId: null,
                            eventTitle: "",
                            eventDate: "",
                            eventLocation: "",
                          });
                        }}
                        className="p-1 hover:bg-indigo-100 rounded transition-all"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Event (Required)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for an event..."
                        value={eventSearchQuery || ""}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {/* Event Results */}
                    <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                      {events
                        .filter((e) => {
                          const query = (eventSearchQuery || "").toLowerCase();
                          return (
                            e.title.toLowerCase().includes(query) ||
                            e.location?.toLowerCase().includes(query) ||
                            e.category?.toLowerCase().includes(query)
                          );
                        })
                        .map((event) => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setNewFeedPost({
                                ...newFeedPost,
                                eventId: event.id,
                                eventTitle: event.title,
                                eventDate: event.date,
                                eventLocation: event.location,
                                eventPhase: getEventPhase(event),
                              });
                              setPostComposerEvent(event);
                              setEventSearchQuery("");
                            }}
                            className="w-full text-left p-3 hover:bg-indigo-50 transition-all border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {event.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span>
                                    {new Date(event.date).toLocaleDateString()}
                                  </span>
                                  <span>•</span>
                                  <span className="truncate">
                                    {event.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}

                      {events.filter((e) => {
                        const query = (eventSearchQuery || "").toLowerCase();
                        return (
                          e.title.toLowerCase().includes(query) ||
                          e.location?.toLowerCase().includes(query) ||
                          e.category?.toLowerCase().includes(query)
                        );
                      }).length === 0 && (
                          <div className="p-6 text-center text-gray-500">
                            <p>No events found</p>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Quick Actions Bar - Functional */}
                <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                   {/* Photo Upload */}
<label
  className="p-2 hover:bg-white rounded-lg transition-all cursor-pointer"
  title="Add photo"
>
  <svg
    className="w-5 h-5 text-green-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={async (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('📷 Selected file:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        // Show uploading toast
        showInfoToast("Uploading photo...");
        setUploadingPost(true);

        // Upload image
        const formData = new FormData();
        formData.append("image", file);

        try {
          const response = await fetch(
            `${API_URL}/api/upload`,
            {
              method: "POST",
              body: formData,
            },
          );

          const data = await response.json();

          if (response.ok) {
            setNewFeedPost({
              ...newFeedPost,
              mediaUrl: data.url,
              postType: "photo",
            });
            showSuccessToast("Photo uploaded!");
          } else {
            console.error('Upload failed:', data);
            showErrorToast(data.error || "Failed to upload photo");
          }
        } catch (error) {
          console.error("Upload error:", error);
          showErrorToast("Failed to upload photo");
        } finally {
          setUploadingPost(false);
        }
      }
    }}
  />
</label>
                    {/* Event Tag - Already handled by selector */}
                    <button
                      onClick={() => {
                        // Scroll to event selector
                        showInfoToast("Select an event above");
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-all"
                      title="Tag event"
                    >
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </button>

                    {/* Mark as Live */}
                    <button
                      onClick={() => {
                        setNewFeedPost({
                          ...newFeedPost,
                          postType:
                            newFeedPost.postType === "live" ? "text" : "live",
                        });
                        showInfoToast(
                          newFeedPost.postType === "live"
                            ? "Removed live status"
                            : "Marked as live update",
                        );
                      }}
                      className={`p-2 hover:bg-white rounded-lg transition-all ${newFeedPost.postType === "live" ? "bg-red-50" : ""}`}
                      title="Mark as live"
                    >
                      <span className="text-lg">
                        {newFeedPost.postType === "live" ? "🔴" : "⚪"}
                      </span>
                    </button>
                  </div>

                  <span className="text-sm text-gray-500">
                    {newFeedPost.content.length}/500
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPostComposer(false);
                    setNewFeedPost({
                      eventId: null,
                      eventTitle: "",
                      eventDate: "",
                      eventLocation: "",
                      content: "",
                      mediaUrl: "",
                      postType: "text",
                      eventPhase: "upcoming",
                    });
                    setPostComposerEvent(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newFeedPost.content.trim() || !newFeedPost.eventId) {
                      showErrorToast(
                        "Please write something and select an event",
                      );
                      return;
                    }

                    try {
                      // Determine post type based on media
                      let postType = "text";
                      if (newFeedPost.mediaUrl) {
                        postType = "photo"; // or 'video' if you support videos
                      }

                      // Determine event phase based on your toggle
                      let eventPhase = newFeedPost.eventPhase || "upcoming";
                      if (newFeedPost.postType === "live") {
                        eventPhase = "live";
                      }

                      const postData = {
                        eventId: newFeedPost.eventId,
                        eventTitle: newFeedPost.eventTitle,
                        eventDate: newFeedPost.eventDate,
                        eventLocation: newFeedPost.eventLocation,
                        postType: postType,
                        content: newFeedPost.content,
                        mediaUrl: newFeedPost.mediaUrl || "",
                        eventPhase: eventPhase,
                        isCheckedIn: eventPhase === "live" ? true : false, // Auto check-in for live posts
                      };

                      console.log("📤 Sending to backend:", postData);

                      const response = await fetch(
                        `${API_URL}/api/feed-posts`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authToken}`,
                          },
                          body: JSON.stringify(postData),
                        },
                      );

                      const data = await response.json();
                      console.log("📥 Backend response:", data);

                      if (response.ok) {
                        showSuccessToast("Post created!");
                        setShowPostComposer(false);
                        setNewFeedPost({
                          eventId: null,
                          eventTitle: "",
                          eventDate: "",
                          eventLocation: "",
                          content: "",
                          mediaUrl: "",
                          postType: "text",
                          eventPhase: "upcoming",
                        });
                        setPostComposerEvent(null);
                        fetchFeedPosts();
                      } else {
                        console.error("❌ Backend error:", data);
                        showErrorToast(
                          data.error || data.message || "Failed to create post",
                        );
                      }
                    } catch (error) {
                      console.error("❌ Network error:", error);
                      showErrorToast("Failed to create post");
                    }
                  }}
                  disabled={!newFeedPost.content.trim() || !newFeedPost.eventId}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation - OUTSIDE PullToRefresh */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>

              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>

              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </>
    );
  }

  // Event Detail View - Enhanced

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "event-detail" && selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Image Modal */}
        {showImageModal && (
          <ImageModal
            image={modalImage}
            title={modalEventTitle}
            onClose={() => {
              setShowImageModal(false);
              setModalImage("");
              setModalEventTitle("");
            }}
          />
        )}

        <ToastNotification />

        <div className="max-w-4xl mx-auto">
          {/* Hero Banner with Full Image Option */}
          <div className="relative h-[60vh] md:h-[70vh] max-h-[600px]">
            {/* Background Image */}
            <div
              className="absolute inset-0 cursor-zoom-in group"
              onClick={() => {
                setModalImage(selectedEvent.image);
                setModalEventTitle(selectedEvent.title);
                setShowImageModal(true);
              }}
            >
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient Overlay - Stronger for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

              {/* Expand Hint */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>View full image</span>
              </div>
            </div>

            {/* Event Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* ADD STATUS BADGE FIRST */}
                  <EventStatusBadge event={selectedEvent} />

                  {selectedEvent.verified && (
                    <div className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full font-bold">
                      <span>✓ Verified</span>
                    </div>
                  )}

                  {selectedEvent.privacy &&
                    selectedEvent.privacy !== "public" && (
                      <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-bold">
                        <span>
                          {selectedEvent.privacy === "private"
                            ? "Private"
                            : "Invite Only"}
                        </span>
                      </div>
                    )}

                  <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-bold">
                    <span>
                      {selectedEvent.category?.toUpperCase() || "EVENT"}
                    </span>
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 text-white drop-shadow-2xl leading-tight">
                  {selectedEvent.title}
                </h1>

                <div className="flex items-center gap-3 text-white/90">
                  <span className="text-lg font-medium">
                    by {selectedEvent.organizer}
                  </span>
                  {user && selectedEvent.organizer_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          isFollowing[`organizer-${selectedEvent.organizer_id}`]
                        ) {
                          handleUnfollow(
                            "organizer",
                            selectedEvent.organizer_id,
                          );
                        } else {
                          handleFollow(
                            "organizer",
                            selectedEvent.organizer_id,
                            selectedEvent.organizer,
                          );
                        }
                      }}
                      className={`${isFollowing[`organizer-${selectedEvent.organizer_id}`]
                        ? "bg-white text-gray-900"
                        : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                        } px-3 py-1.5 rounded-full text-sm font-semibold transition-all`}
                    >
                      {isFollowing[`organizer-${selectedEvent.organizer_id}`]
                        ? "✓ Following"
                        : "+ Follow"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setView("discover")}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-lg"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(selectedEvent);
                }}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-lg"
              >
                <Share2 className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={() => handleLike(selectedEvent.id)}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-lg"
              >
                <Heart
                  className={`w-6 h-6 ${likedEvents.includes(selectedEvent.id) ? "fill-red-500 text-red-500" : "text-gray-700"}`}
                />
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-4 -mt-8 relative z-10 space-y-4">
            {/* Quick Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Date & Time
                    </div>
                    <div className="font-bold text-gray-900">
                      {new Date(selectedEvent.date).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedEvent.time}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Location
                    </div>
                    <div className="font-bold text-gray-900 line-clamp-2">
                      {selectedEvent.location}
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1">
                      View map →
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-1">
                      Ticket Price
                    </div>
                    <div className="font-bold text-gray-900 text-xl">
                      {selectedEvent.price}
                    </div>
                    {selectedEvent.price?.toLowerCase().includes("free") && (
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        FREE EVENT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RSVP Card - Simplified & Social */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Are you going?
                  </h3>
                  <p className="text-sm text-gray-500">
                    {eventRSVPs[selectedEvent.id]?.going?.length || 0}{" "}
                    {(eventRSVPs[selectedEvent.id]?.going?.length || 0) === 1
                      ? "person is"
                      : "people are"}{" "}
                    going
                  </p>
                </div>

                {/* Attendee Avatars */}
                {eventRSVPs[selectedEvent.id]?.going?.length > 0 && (
                  <div className="flex -space-x-3">
                    {eventRSVPs[selectedEvent.id].going
                      .slice(0, 5)
                      .map((attendee, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white"
                        >
                          {getInitial(attendee.user_name)}
                        </div>
                      ))}
                    {eventRSVPs[selectedEvent.id].going.length > 5 && (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs border-2 border-white">
                        +{eventRSVPs[selectedEvent.id].going.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => handleRSVP(selectedEvent.id, "going")}
                  className={`py-3 rounded-xl font-semibold transition-all ${rsvpStatus[selectedEvent.id] === "going"
                    ? "bg-green-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-sm">Going</div>
                </button>

                <button
                  onClick={() => handleRSVP(selectedEvent.id, "maybe")}
                  className={`py-3 rounded-xl font-semibold transition-all ${rsvpStatus[selectedEvent.id] === "maybe"
                    ? "bg-yellow-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <div className="text-2xl mb-1">?</div>
                  <div className="text-sm">Maybe</div>
                </button>

                <button
                  onClick={() => handleRSVP(selectedEvent.id, "not_going")}
                  className={`py-3 rounded-xl font-semibold transition-all ${rsvpStatus[selectedEvent.id] === "not_going"
                    ? "bg-red-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <div className="text-2xl mb-1">✗</div>
                  <div className="text-sm">Can't Go</div>
                </button>
              </div>

              {eventRSVPs[selectedEvent.id]?.going?.length > 0 && (
                <button
                  onClick={() => {
                    setView("attendees");
                    if (user && eventRSVPs[selectedEvent.id]) {
                      eventRSVPs[selectedEvent.id].going?.forEach(
                        (attendee) => {
                          if (attendee.user_id !== user.id) {
                            checkBuddyStatus(attendee.user_id);
                          }
                        },
                      );
                    }
                  }}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-semibold py-2"
                >
                  See all attendees →
                </button>
              )}
            </div>

            {/* ADD MUTUAL BUDDIES SECTION HERE */}
            {mutualBuddies[selectedEvent.id] &&
              mutualBuddies[selectedEvent.id].length > 0 && (
                <div className="px-4 mb-4">
                  <MutualBuddiesBadge
                    eventId={selectedEvent.id}
                    compact={false}
                  />
                </div>
              )}

            {/* Mutual Buddies Section */}
            {mutualBuddies[selectedEvent.id] &&
              mutualBuddies[selectedEvent.id].length > 0 && (
                <div className="px-4 mb-4">
                  <MutualBuddiesBadge
                    eventId={selectedEvent.id}
                    compact={false}
                  />
                </div>
              )}

            {/* About Section */}
            {selectedEvent.description && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  About This Event
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Lineup */}
            {selectedEvent.lineup && selectedEvent.lineup.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎵</span>
                  Lineup
                </h2>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.lineup.map((performer, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 py-2 rounded-full font-semibold"
                    >
                      {performer}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Actions - Lightweight */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  setView("event-feed");
                  setPosts([]); // Clear old posts

                  // Fetch posts from both sources
                  try {
                    const [feedPostsResponse, eventPostsResponse] =
                      await Promise.all([
                        fetch(`${API_URL}/api/feed-posts`),
                        fetch(`${API_URL}/api/posts/event/${selectedEvent.id}`),
                      ]);

                    let allPosts = [];

                    if (feedPostsResponse.ok) {
                      const feedData = await feedPostsResponse.json();
                      const eventFeedPosts = feedData.filter(
                        (post) => post.event_id === selectedEvent.id,
                      );
                      allPosts = [...eventFeedPosts];
                    }

                    if (eventPostsResponse.ok) {
                      const eventData = await eventPostsResponse.json();
                      allPosts = [...allPosts, ...eventData];
                    }

                    const uniquePosts = allPosts.filter(
                      (post, index, self) =>
                        index === self.findIndex((p) => p.id === post.id),
                    );

                    uniquePosts.sort(
                      (a, b) => new Date(b.created_at) - new Date(a.created_at),
                    );
                    setPosts(uniquePosts);
                  } catch (error) {
                    console.error("Error loading posts:", error);
                  }

                  const interval = startPolling(selectedEvent.id);
                  setPollingInterval(interval);
                }}
                className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-2xl">
                    📸
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      Event Feed
                    </div>
                    <div className="text-xs text-gray-500">
                      Photos & updates
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  setView("event-chat");
                  fetchEventMessages(selectedEvent.id);
                  const interval = startChatPolling(selectedEvent.id);
                  setPollingInterval(interval);
                }}
                className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl">
                    💬
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      Chat Room
                    </div>
                    <div className="text-xs text-gray-500">
                      Connect with others
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            </div>

            {/* Primary CTA - Single Clear Action */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm opacity-90 mb-1">Ready to join?</div>
                  <div className="text-3xl font-bold">
                    {selectedEvent.price}
                  </div>
                </div>
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFollowing[`event-${selectedEvent.id}`]) {
                        handleUnfollow("event", selectedEvent.id);
                      } else {
                        handleFollow(
                          "event",
                          selectedEvent.id,
                          selectedEvent.title,
                        );
                      }
                    }}
                    className={`${isFollowing[`event-${selectedEvent.id}`]
                      ? "bg-white text-indigo-600"
                      : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                      } px-4 py-2 rounded-full text-sm font-semibold transition-all`}
                  >
                    {isFollowing[`event-${selectedEvent.id}`]
                      ? "✓ Following"
                      : "+ Follow Event"}
                  </button>
                )}
              </div>
              <button className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all">
                Get Tickets
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>
              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Attendees View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "attendees" && selectedEvent) {
    const rsvps = eventRSVPs[selectedEvent.id];

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <ToastNotification />
              <button
                onClick={() => {
                  setView("event-detail");
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    Event Feed
                  </h1>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-sm text-gray-500">{selectedEvent.title}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Going */}
          {rsvps?.going?.map((attendee) => (
            <div
              key={attendee.user_id}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {attendee.user_id === user?.id && user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={attendee.user_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : attendee.profile_picture ? (
                  <img
                    src={attendee.profile_picture}
                    alt={attendee.user_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {getInitial(attendee.user_name)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {attendee.user_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {attendee.user_email}
                  </div>
                </div>
                {user && user.id !== attendee.user_id && (
                  <div className="flex gap-2">
                    {buddyStatus[attendee.user_id] === "buddies" ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                        ✓ Buddies
                      </span>
                    ) : buddyStatus[attendee.user_id] === "sent" ? (
                      <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-semibold">
                        Request Sent
                      </span>
                    ) : buddyStatus[attendee.user_id] === "received" ? (
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                        Respond
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          sendBuddyRequest(attendee.user_id, attendee.user_name)
                        }
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:shadow-sm transition-all"
                      >
                        + Add Buddy
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedConversation({
                          userId: attendee.user_id,
                          userName: attendee.user_name,
                        });
                        setView("dm-conversation");
                        fetchDmConversation(attendee.user_id);
                        const interval = startDmPolling(attendee.user_id);
                        setPollingInterval(interval);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold hover:shadow-sm transition-all"
                    >
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Maybe */}
          {rsvps?.maybe && rsvps.maybe.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-600 rounded-full"></span>
                Maybe ({rsvps.maybe.length})
              </h2>
              <div className="space-y-3">
                {rsvps.maybe.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {getInitial(attendee.user_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {attendee.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendee.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Can't Go */}
          {rsvps?.not_going && rsvps.not_going.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                Can't Go ({rsvps.not_going.length})
              </h2>
              <div className="space-y-3">
                {rsvps.not_going.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                      {getInitial(attendee.user_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {attendee.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendee.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!rsvps ||
            (rsvps.going?.length === 0 &&
              rsvps.maybe?.length === 0 &&
              rsvps.not_going?.length === 0)) && <AttendeesEmptyState />}
        </div>
      </div>
    );
  }

  // Explore Events View
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "explore") {
    console.log("🔍 EXPLORE VIEW ACTIVE!", {
      eventsCount: events.length,
      exploreCategory,
      exploreSortBy,
    });

    const categories = [
      { id: "all", name: "All Events" },//, icon: "🎉" },
      { id: "music", name: "Music" },//, icon: "🎵" },
      { id: "sports", name: "Sports" },//, icon: "⚽" },
      { id: "tech", name: "Tech" },//, icon: "💻" },
      { id: "food", name: "Food & Drink" },//, icon: "🍔" },
      { id: "arts", name: "Arts" },//, icon: "🎨" },
      { id: "networking", name: "Networking" },//, icon: "🤝" },
      { id: "education", name: "Education" },//, icon: "📚" },
      { id: "health", name: "Health & Fitness" },//, icon: "💪" },
      { id: "entertainment", name: "Entertainment" },//, icon: "🎭" },
    ];

    // Apply category filter first
    let filteredEvents =
      exploreCategory === "all"
        ? events
        : events.filter((e) => e.category?.toLowerCase() === exploreCategory);

    // Then apply advanced filters
    filteredEvents = applyAdvancedFilters(filteredEvents, activeFilters);

    // Sort events
    // Sort events with priority
    let sortedEvents = [...filteredEvents];

    // Always prioritize by phase first
    sortedEvents.sort((a, b) => {
      const phaseA = getEventPhase(a);
      const phaseB = getEventPhase(b);

      // Priority order: live > starting-soon > today > upcoming > past
      const phasePriority = {
        live: 5,
        "starting-soon": 4,
        upcoming: 2, // Will be boosted if today
        past: 0,
      };

      // Check if today
      const isAToday =
        new Date(a.date).toDateString() === new Date().toDateString();
      const isBToday =
        new Date(b.date).toDateString() === new Date().toDateString();

      const priorityA =
        phasePriority[phaseA] + (isAToday && phaseA === "upcoming" ? 1 : 0);
      const priorityB =
        phasePriority[phaseB] + (isBToday && phaseB === "upcoming" ? 1 : 0);

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }

      // Then sort by user preference
      if (exploreSortBy === "upcoming") {
        return new Date(a.date) - new Date(b.date);
      } else if (exploreSortBy === "popular") {
        return (b.attending || 0) - (a.attending || 0);
      }

      return 0;
    });

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ToastNotification />
        {/* Header - Enhanced with Context */}
        {/* Header - Enhanced with Context */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {(() => {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const hour = now.getHours();
                    if (
                      (dayOfWeek === 5 && hour >= 17) ||
                      dayOfWeek === 6 ||
                      dayOfWeek === 0
                    )
                      return "🔥";
                    if (hour >= 17 && hour <= 23) return "🌙";
                    return "✨";
                  })()}
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const now = new Date();
                      const dayOfWeek = now.getDay();
                      const hour = now.getHours();
                      if (
                        (dayOfWeek === 5 && hour >= 17) ||
                        dayOfWeek === 6 ||
                        dayOfWeek === 0
                      )
                        return "Trending this weekend";
                      if (hour >= 17 && hour <= 23) return "Tonight's picks";
                      return "Discover events";
                    })()}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {sortedEvents.length} events in Nairobi
                  </p>
                </div>
              </div>

              {/* UPDATED: Added Filter Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(true)}
                  className="relative px-4 py-2 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span>Filters</span>
                  {/* Active filter count badge */}
                  {(() => {
                    const count =
                      (activeFilters.dateRange !== "all" ? 1 : 0) +
                      (activeFilters.priceRange !== "all" ? 1 : 0) +
                      activeFilters.categories.length +
                      (activeFilters.verified ? 1 : 0) +
                      (activeFilters.distance !== "all" ? 1 : 0);
                    return count > 0 ? (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {count}
                      </span>
                    ) : null;
                  })()}
                </button>

                <button
                  onClick={() => setView("discover")}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(() => {
              const hasActiveFilters =
                activeFilters.dateRange !== "all" ||
                activeFilters.priceRange !== "all" ||
                activeFilters.categories.length > 0 ||
                activeFilters.verified ||
                activeFilters.distance !== "all";

              if (!hasActiveFilters) return null;

              const filterLabels = {
                dateRange: {
                  today: "Today",
                  weekend: "This weekend",
                  week: "This week",
                  month: "This month",
                },
                priceRange: {
                  free: "Free",
                  under1000: "Under KES 1,000",
                  under5000: "Under KES 5,000",
                  premium: "Premium",
                },
                distance: {
                  nearby: "Nearby",
                  city: "Within Nairobi",
                },
              };

              return (
                <div className="flex flex-wrap gap-2 mb-3">
                  {activeFilters.dateRange !== "all" && (
                    <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <span>
                        📅 {filterLabels.dateRange[activeFilters.dateRange]}
                      </span>
                      <button
                        onClick={() =>
                          setActiveFilters({
                            ...activeFilters,
                            dateRange: "all",
                          })
                        }
                        className="hover:bg-indigo-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {activeFilters.priceRange !== "all" && (
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <span>
                        💰
                        {filterLabels.priceRange[activeFilters.priceRange]}
                      </span>
                      <button
                        onClick={() =>
                          setActiveFilters({
                            ...activeFilters,
                            priceRange: "all",
                          })
                        }
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {activeFilters.categories.map((cat) => (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-semibold"
                    >
                      <span>
                        {cat && typeof cat === 'string' && cat.trim() !== ''
                          ? cat.charAt(0).toUpperCase() + cat.slice(1)
                          : "?"}
                      </span>
                      <button
                        onClick={() =>
                          setActiveFilters({
                            ...activeFilters,
                            categories: activeFilters.categories.filter(
                              (c) => c !== cat,
                            ),
                          })
                        }
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {activeFilters.verified && (
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <span>✓ Verified only</span>
                      <button
                        onClick={() =>
                          setActiveFilters({
                            ...activeFilters,
                            verified: false,
                          })
                        }
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {activeFilters.distance !== "all" && (
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <span>
                        📍 {filterLabels.distance[activeFilters.distance]}
                      </span>
                      <button
                        onClick={() =>
                          setActiveFilters({
                            ...activeFilters,
                            distance: "all",
                          })
                        }
                        className="hover:bg-orange-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setActiveFilters({
                        dateRange: "all",
                        priceRange: "all",
                        categories: [],
                        verified: false,
                        distance: "all",
                      })
                    }
                    className="text-sm text-gray-600 hover:text-gray-900 font-semibold underline"
                  >
                    Clear all filters
                  </button>
                </div>
              );
            })()}

            {/* Quick Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  const todayEvents = events.filter((e) => e.date === today);
                  if (todayEvents.length > 0) {
                    showSuccessToast(
                      `Found ${todayEvents.length} events today!`,
                    );
                  } else {
                    showInfoToast("No events today");
                  }
                }}
                className="px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-full font-semibold hover:bg-indigo-50 transition-all whitespace-nowrap flex items-center gap-1"
              >
                <Clock className="w-4 h-4" />
                Today
              </button>

              <button
                onClick={() => {
                  const freeEvents = events.filter(
                    (e) =>
                      e.price?.toLowerCase().includes("free") ||
                      e.price?.toLowerCase() === "0" ||
                      e.price === "Free",
                  );
                  if (freeEvents.length > 0) {
                    showSuccessToast(`Found ${freeEvents.length} free events!`);
                  } else {
                    showInfoToast("No free events available");
                  }
                }}
                className="px-4 py-2 bg-white border-2 border-green-200 text-green-700 rounded-full font-semibold hover:bg-green-50 transition-all whitespace-nowrap"
              >
                Free
              </button>

              <button
                onClick={() => {
                  const verifiedEvents = events.filter((e) => e.verified);
                  if (verifiedEvents.length > 0) {
                    showSuccessToast(
                      `Found ${verifiedEvents.length} verified events!`,
                    );
                  } else {
                    showInfoToast("No verified events available");
                  }
                }}
                className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-full font-semibold hover:bg-blue-50 transition-all whitespace-nowrap"
              >
                ✓ Verified
              </button>

              <button
                onClick={() => {
                  const weekendEvents = events.filter((e) => {
                    const eventDay = new Date(e.date).getDay();
                    return eventDay === 5 || eventDay === 6 || eventDay === 0;
                  });
                  if (weekendEvents.length > 0) {
                    showSuccessToast(
                      `Found ${weekendEvents.length} weekend events!`,
                    );
                  } else {
                    showInfoToast("No weekend events available");
                  }
                }}
                className="px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-full font-semibold hover:bg-purple-50 transition-all whitespace-nowrap"
              >
                This Weekend
              </button>
            </div>
          </div>
        </header>

        {/* Sticky Category Filters */}
        <div className="bg-white border-b sticky top-[120px] z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setExploreCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${exploreCategory === cat.id
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar - Hidden on mobile, visible on tablet+ */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
                <h2 className="font-bold text-gray-900 mb-3">Categories</h2>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setExploreCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${exploreCategory === cat.id
                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">
                    Sort By
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setExploreSortBy("upcoming")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${exploreSortBy === "upcoming"
                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setExploreSortBy("popular")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${exploreSortBy === "popular"
                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      Popular
                    </button>
                    <button
                      onClick={() => setExploreSortBy("trending")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${exploreSortBy === "trending"
                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      Trending
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Events Grid */}
            <div className="flex-1">
              {/* Mobile Category Filter */}
              <div className="lg:hidden mb-4">
                <select
                  value={exploreCategory}
                  onChange={(e) => setExploreCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  <button
                    onClick={() => setExploreSortBy("upcoming")}
                    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${exploreSortBy === "upcoming"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setExploreSortBy("popular")}
                    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${exploreSortBy === "popular"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    Popular
                  </button>
                  <button
                    onClick={() => setExploreSortBy("trending")}
                    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${exploreSortBy === "trending"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    Trending
                  </button>
                </div>
              </div>
              {/* Events Grid */}
              <div className="flex-1"></div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {exploreCategory === "all"
                    ? "All Events"
                    : categories.find((c) => c.id === exploreCategory)?.name}
                  <span className="text-gray-500 font-normal ml-2">
                    ({sortedEvents.length})
                  </span>
                </h2>
              </div>

              {loading ? (
                <SkeletonGrid count={6} />
              ) : sortedEvents.length === 0 ? (
                <ExploreNoResultsState
                  category={exploreCategory}
                  onResetFilters={() => {
                    setExploreCategory("all");
                    setExploreSortBy("upcoming");
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer group transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                    >
                      {/* Image with Zoom Effect */}
                      <div
                        className="relative h-48 overflow-hidden bg-gray-900"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          setModalImage(event.image);
                          setModalEventTitle(event.title);
                          setShowImageModal(true);
                        }}
                      >
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                        />

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Badges */}
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                        />

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* ADD STATUS BADGE HERE - Top Left, Above Other Badges */}
                        <div className="absolute top-3 left-3 z-20">
                          <EventStatusBadge event={event} />
                        </div>

                        {/* Other Badges - Slightly Below Status Badge */}
                        <div className="absolute top-14 left-3 flex flex-col gap-2 z-10">
                          {event.verified && (
                            <div className="bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg flex items-center gap-1">
                              <span>✓</span>
                              <span>Verified</span>
                            </div>
                          )}

                          {/* Privacy Badge with clearer distinction */}
                          {event.privacy && event.privacy !== "public" && (
                            <div
                              className={`text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg flex items-center gap-1 ${event.privacy === "private"
                                ? "bg-gray-700"
                                : "bg-indigo-600"
                                }`}
                            >
                              <span>
                                {event.privacy === "private" ? "🔒" : "📨"}
                              </span>
                              <span>
                                {event.privacy === "private"
                                  ? "Private"
                                  : "Invite Only"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* View Full Image hint on hover */}
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Click to expand</span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div
                        className="p-4"
                        onClick={() => {
                          setSelectedEvent(event);
                          setView("event-detail");
                          if (user) {
                            fetchUserRSVP(event.id);
                            checkIsFollowing("event", event.id);
                            if (event.organizer_id) {
                              checkIsFollowing("organizer", event.organizer_id);
                            }
                          }
                          fetchEventRSVPs(event.id);
                          fetchFollowerCount("event", event.id);
                        }}
                      >
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          by {event.organizer}
                        </p>

                        {/* Mutual Buddies Badge */}
                        {mutualBuddies[event.id] &&
                          mutualBuddies[event.id].length > 0 && (
                            <div className="mb-3">
                              <MutualBuddiesBadge
                                eventId={event.id}
                                compact={true}
                              />
                            </div>
                          )}
                        <div className="space-y-2 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-gray-700">
                              {new Date(event.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            <span className="line-clamp-1 text-gray-700">
                              {event.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span className="text-gray-700">
                              <span className="font-semibold text-gray-900">
                                {event.attending}
                              </span>{" "}
                              attending
                            </span>
                          </div>
                        </div>

                        {/* Enhanced CTA Section */}
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              {event.price}
                            </span>
                            {event.price?.toLowerCase().includes("free") && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                FREE EVENT
                              </span>
                            )}
                          </div>

                          {/* Dual Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setView("event-detail");
                                if (user) {
                                  fetchUserRSVP(event.id);
                                  checkIsFollowing("event", event.id);
                                  if (event.organizer_id) {
                                    checkIsFollowing(
                                      "organizer",
                                      event.organizer_id,
                                    );
                                  }
                                }
                                fetchEventRSVPs(event.id);
                                fetchFollowerCount("event", event.id);
                              }}
                              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (user) {
                                  handleRSVP(event.id, "going");
                                  showSuccessToast(
                                    `You're going to ${event.title}!`,
                                  );
                                } else {
                                  showInfoToast("Please login to RSVP");
                                  setView("login");
                                }
                              }}
                              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                            >
                              Join Event
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Advanced Filters Modal */}
          <AdvancedFiltersModal
            show={showFilters}
            onClose={() => setShowFilters(false)}
            filters={activeFilters}
            onApply={(newFilters) => {
              setActiveFilters(newFilters);
              showSuccessToast("Filters applied!");
            }}
          />
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                {" "}
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>
              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>{" "}
                <span className="text-xs font-medium mt-1">Create</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Profile Page View
  // Profile Page View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "profile") {
    // Get user's posts and events
    const userPosts = feedPosts.filter((post) => post.user_id === user?.id);
    const userEvents = events.filter(
      (event) => event.organizer_id === user?.id,
    );
    const attendedEvents = events.filter(
      (event) => rsvpStatus[event.id] === "going",
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
        <ToastNotification />

        {/* Stats Modal */}
        <StatsModal
          show={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          tab={activeStatsTab}
          userPosts={userPosts}
          userEvents={userEvents}
          attendedEvents={attendedEvents}
        />

        {/* Edit Profile Modal */}
        <EditProfileModal
          show={editingProfile}
          onClose={() => setEditingProfile(false)}
          user={user}
          bio={editBio}
          interests={editInterests}
          onSave={handleSaveProfile}
        />

        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Enhanced Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col items-center text-center mb-6">
              {/* Profile Picture */}
              <div className="relative mb-4">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-5xl border-4 border-indigo-100 shadow-lg">
                    {getInitial(user?.name)}
                  </div>
                )}
              </div>

              {/* Name, Username, Bio */}
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {user?.name}
              </h2>
              <p className="text-gray-500 mb-2">
                @{user?.email?.split("@")[0]}
              </p>
              <p className="text-gray-700 max-w-md leading-relaxed whitespace-pre-wrap">
                {user?.bio || editBio || "Always down for a good time"}
              </p>

              {/* Interests Tags */}
              {(user?.interests || editInterests)?.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-md">
                  {(user?.interests || editInterests).map((interest, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-sm font-semibold"
                    >
                      <span>{interest.icon}</span>
                      <span>{interest.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats - Interactive */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100">
              <button
                onClick={() => {
                  setActiveStatsTab("posts");
                  setShowStatsModal(true);
                }}
                className="text-center hover:bg-indigo-50 rounded-lg p-3 transition-all group"
              >
                <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {userPosts.length}
                </div>
                <div className="text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                  Posts
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveStatsTab("events");
                  setShowStatsModal(true);
                }}
                className="text-center hover:bg-purple-50 rounded-lg p-3 transition-all group"
              >
                <div className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {userEvents.length}
                </div>
                <div className="text-sm text-gray-500 group-hover:text-purple-600 transition-colors">
                  Events
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveStatsTab("attended");
                  setShowStatsModal(true);
                }}
                className="text-center hover:bg-green-50 rounded-lg p-3 transition-all group"
              >
                <div className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {attendedEvents.length}
                </div>
                <div className="text-sm text-gray-500 group-hover:text-green-600 transition-colors">
                  Attended
                </div>
              </button>
            </div>

            {/* Edit Profile Button */}
            <div className="mt-6 space-y-3">
              {/* Edit Bio & Interests */}
              <button
                onClick={() => {
                  setEditBio(user?.bio || "Always down for a good time");
                  setEditInterests(user?.interests || []);
                  setEditingProfile(true);
                }}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Profile</span>
              </button>

              {/* Upload Photo Options */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-200">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-700">
                    Upload Photo
                  </span>
                  {uploadingProfilePic && (
                    <LoadingSpinner size="sm" color="purple" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleProfilePictureUpload(file);
                    }}
                    disabled={uploadingProfilePic}
                  />
                </label>

                <label className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-200">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-gray-700">
                    Take Photo
                  </span>
                  {uploadingProfilePic && (
                    <LoadingSpinner size="sm" color="purple" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleProfilePictureUpload(file);
                    }}
                    disabled={uploadingProfilePic}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Activity Section - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Activity</h2>
                  <p className="text-sm text-gray-500">
                    {userPosts.length}{" "}
                    {userPosts.length === 1 ? "post" : "posts"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setView("discover");
                    setShowPostComposer(true);
                  }}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Post</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              {userPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-40"></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Share your event experiences, moments, and updates with the
                    community!
                  </p>
                  <button
                    onClick={() => {
                      setView("discover");
                      setShowPostComposer(true);
                    }}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    <span className="text-xl"></span>
                    Create Your First Post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => {
                    // Get reactions and comments for this post
                    const postReactionData = feedReactions[post.id] || {};
                    const totalLikes = postReactionData.like?.length || 0;
                    const postCommentsData = feedComments[post.id] || [];
                    const totalComments = postCommentsData.length;

                    return (
                      <div
                        key={post.id}
                        className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all group"
                      >
                        {/* Post Header */}
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center justify-between mb-2">
                            {/* Post Type Badge */}
                            <div className="flex items-center gap-2">
                              {(post.media_url || post.image) && post.post_type === "photo" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Photo
                                </span>
                              )}
                              {(post.media_url || post.image) && post.post_type === "video" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Video
                                </span>
                              )}
                              {!(post.media_url || post.image) && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                  <MessageCircle className="w-3 h-3" />
                                  Text
                                </span>
                              )}
                            </div>

                            {/* Timestamp */}
                            <span className="text-xs text-gray-500">
                              {new Date(post.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>

                          {/* Event Context Chip */}
                          <div
                            onClick={() => {
                              const event = events.find(
                                (e) => e.id === post.event_id,
                              );
                              if (event) {
                                setSelectedEvent(event);
                                setView("event-detail");
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 transition-all cursor-pointer"
                          >
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              {post.event_title}
                            </span>
                            <svg
                              className="w-3 h-3 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4">
                          {post.content && (
                            <p className="text-gray-900 mb-3 leading-relaxed">
                              {post.content}
                            </p>
                          )}
                          {(post.media_url || post.image) && (
                            <div className="rounded-lg overflow-hidden mb-3">
                              {post.post_type === "video" ? (
                                <video
                                  src={(post.media_url || post.image)}
                                  controls
                                  className="w-full max-h-80 object-cover"
                                />
                              ) : (
                                <img
                                  src={(post.media_url || post.image)}
                                  alt="Post media"
                                  className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() => {
                                    setModalImage((post.media_url || post.image));
                                    setModalEventTitle(post.event_title);
                                    setShowImageModal(true);
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Engagement Footer */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            {/* Likes & Comments Count */}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {totalLikes > 0 && (
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                  <span className="font-semibold">
                                    {totalLikes}
                                  </span>
                                </div>
                              )}
                              {totalComments > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                                  <span className="font-semibold">
                                    {totalComments}
                                  </span>
                                </div>
                              )}
                              {totalLikes === 0 && totalComments === 0 && (
                                <span className="text-gray-400 italic text-xs">
                                  No engagement yet
                                </span>
                              )}
                            </div>

                            {/* View Post Button */}
                            <button
                              onClick={() => {
                                setView("discover");
                                // Optionally scroll to this post
                              }}
                              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                            >
                              View Post
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>
              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }
  // // Profile Events Tab
  // if (view === 'profile-events') {
  //   const userEvents = events.filter(event => event.organizer_id === user?.id);
  //   const attendedEvents = events.filter(event => rsvpStatus[event.id] === 'going');

  //   return (
  //     <div className="min-h-screen bg-gray-50">
  //       <header className="bg-white shadow-sm sticky top-0 z-50">
  //         <div className="max-w-4xl mx-auto px-4 py-4">
  //           <ToastNotification />
  //           <button
  //             onClick={() => setView('profile')}
  //             className="text-gray-900 hover:text-indigo-700 font-semibold"
  //           >
  //             ← Back to Profile
  //           </button>
  //         </div>
  //       </header>

  //       <div className="max-w-4xl mx-auto px-4 py-6">
  //         <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
  //           <div className="flex border-b">
  //             <button
  //               onClick={() => setView('profile')}
  //               className="flex-1 px-4 py-3 font-semibold text-gray-500 hover:text-gray-900"
  //             >
  //               My Posts
  //             </button>
  //             <button className="flex-1 px-4 py-3 font-semibold border-b-2 border-indigo-600 text-gray-900">
  //               My Events
  //             </button>
  //           </div>

  //           <div className="p-4">
  //             {/* Created Events */}
  //             <div className="mb-6">
  //               <h3 className="text-lg font-bold text-gray-900 mb-3">
  //                 Created Events ({userEvents.length})
  //               </h3>
  //               {userEvents.length === 0 ? (
  //   <ProfileNoEventsState
  //     isOwnProfile={true}
  //     onCreateEvent={() => setView('organizer')}
  //   />
  // ) : (
  //                 <div className="space-y-3">
  //                   {userEvents.map((event) => (
  //                     <div
  //                       key={event.id}
  //                       onClick={() => {
  //                         setSelectedEvent(event);
  //                         setView('event-detail');
  //                       }}
  //                       className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
  //                     >
  //                       <img src={event.image} alt={event.title} className="w-16 h-16 rounded-lg object-cover" />
  //                       <div className="flex-1">
  //                         <h4 className="font-bold text-gray-900">{event.title}</h4>
  //                         <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
  //                       </div>
  //                     </div>
  //                   ))}
  //                 </div>
  //               )}
  //             </div>

  //             {/* Attended Events */}
  //             <div>
  //               <h3 className="text-lg font-bold text-gray-900 mb-3">
  //                 Attended Events ({attendedEvents.length})
  //               </h3>
  //              {attendedEvents.length === 0 ? (
  //   <div className="text-center py-8">
  //     <div className="text-4xl mb-2 opacity-50">🎉</div>
  //     <p className="text-gray-500">No events attended yet</p>
  //   </div>
  // ) : (
  //                 <div className="space-y-3">
  //                   {attendedEvents.map((event) => (
  //                     <div
  //                       key={event.id}
  //                       onClick={() => {
  //                         setSelectedEvent(event);
  //                         setView('event-detail');
  //                       }}
  //                       className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
  //                     >
  //                       <img src={event.image} alt={event.title} className="w-16 h-16 rounded-lg object-cover" />
  //                       <div className="flex-1">
  //                         <h4 className="font-bold text-gray-900">{event.title}</h4>
  //                         <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
  //                       </div>
  //                     </div>
  //                   ))}
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // My Events View (Bottom Nav)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "my-events") {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <ToastNotification />
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Login Required
            </h2>
            <p className="text-gray-500">Please login to view your events</p>
          </div>
        </div>
      );
    }

    // Calculate discovery events inline (no useEffect needed)
    const nearbyEvents = events
      .filter((e) => new Date(e.date) > new Date())
      .slice(0, 3);

    const popularEvents = [...events]
      .filter((e) => new Date(e.date) > new Date())
      .sort((a, b) => (b.attending || 0) - (a.attending || 0))
      .slice(0, 3);

    let friendEvents = [];
    if (buddies.length > 0) {
      const friendEventIds = new Set();
      Object.entries(eventRSVPs).forEach(([eventId, rsvps]) => {
        const goingList = rsvps.going || [];
        const hasBuddy = goingList.some((attendee) =>
          buddies.some(
            (buddy) =>
              buddy.buddy_id === attendee.user_id ||
              buddy.user_id === attendee.user_id,
          ),
        );
        if (hasBuddy) friendEventIds.add(parseInt(eventId));
      });

      friendEvents = events
        .filter(
          (e) => friendEventIds.has(e.id) && new Date(e.date) > new Date(),
        )
        .slice(0, 3);
    }

    // Filter user's events by status
    const userCreatedEvents = events.filter((e) => e.organizer_id === user.id);
    const userAttendingEvents = events.filter((e) =>
      eventRSVPs[e.id]?.going?.some((r) => r.user_id === user.id),
    );
    const userInterestedEvents = events.filter((e) =>
      eventRSVPs[e.id]?.maybe?.some((r) => r.user_id === user.id),
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-20 md:pb-8">
        <ToastNotification />

        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">My Events</h1>
              </div>
              <button
                onClick={() => setView("organizer")}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Event</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          {/* Discovery Sections */}
          {(popularEvents.length > 0 ||
            nearbyEvents.length > 0 ||
            friendEvents.length > 0) && (
              <div className="space-y-6">
                {/* Popular Events */}
                {popularEvents.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        Popular Events
                      </h3>
                      <button
                        onClick={() => setView("explore")}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        See all →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {popularEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event);
                            setView("event-detail");
                          }}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all group"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(event.date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{event.attending || 0} attending</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRSVP(event.id, "going");
                                showSuccessToast("Added to your events!");
                              }}
                              className="self-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Events */}
                {nearbyEvents.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        Events Near You
                      </h3>
                      <button
                        onClick={() => setView("explore")}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        See all →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {nearbyEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event);
                            setView("event-detail");
                          }}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all group"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(event.date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{event.attending || 0} attending</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRSVP(event.id, "going");
                                showSuccessToast("Added to your events!");
                              }}
                              className="self-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friend Events */}
                {buddies.length > 0 && friendEvents.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Friends Are Attending
                      </h3>
                      <button
                        onClick={() => setView("explore")}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        See all →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {friendEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event);
                            setView("event-detail");
                          }}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all group"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(event.date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{event.attending || 0} attending</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRSVP(event.id, "going");
                                showSuccessToast("Added to your events!");
                              }}
                              className="self-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Your Events
                  </h2>
                </div>
              </div>
            )}

          {/* User's Created Events */}
          {userCreatedEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Organizing ({userCreatedEvents.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userCreatedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer group transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-900">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                        onClick={() => {
                          setSelectedEvent(event);
                          setView("event-detail");
                        }}
                      />

                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setView("organizer");
                          }}
                          className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition-colors shadow-md"
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Are you sure you want to delete this event?",
                              )
                            ) {
                              handleDeleteEvent(event.id);
                            }
                          }}
                          className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition-colors shadow-md"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="p-4"
                      onClick={() => {
                        setSelectedEvent(event);
                        setView("event-detail");
                      }}
                    >
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(event.date).toLocaleDateString()} at{" "}
                          {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-center">
                        <span className="text-sm font-medium text-indigo-700">
                          You're organizing this event
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's Attending Events */}
          {userAttendingEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Attending ({userAttendingEvents.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAttendingEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setView("event-detail");
                    }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer group transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-900">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(event.date).toLocaleDateString()} at{" "}
                          {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{event.attending || 0} attending</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's Interested Events */}
          {userInterestedEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Interested ({userInterestedEvents.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userInterestedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setView("event-detail");
                    }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer group transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-900">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(event.date).toLocaleDateString()} at{" "}
                          {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{event.attending || 0} attending</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {userCreatedEvents.length === 0 &&
            userAttendingEvents.length === 0 &&
            userInterestedEvents.length === 0 && (
              <EmptyState
                //icon={Calendar}
                title="No Events Yet"
                description="Start by creating your first event or explore events to join"
                actionLabel="Explore Events"
                onAction={() => setView("explore")}
              />
            )}

          {/* Quick Stats Card */}
          {(userCreatedEvents.length > 0 || userAttendingEvents.length > 0) && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-4">
                Your Event Activity
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {userCreatedEvents.length}
                  </div>
                  <div className="text-sm text-indigo-100">Organizing</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {userAttendingEvents.length}
                  </div>
                  <div className="text-sm text-indigo-100">Attending</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {userInterestedEvents.length}
                  </div>
                  <div className="text-sm text-indigo-100">Interested</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>

              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>

              <button
                onClick={() => setView("my-events")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>

              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Buddies Page View
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "buddies") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ToastNotification />

        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("discover")}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Buddies</h1>
                  <p className="text-sm text-gray-500">
                    {buddies.length}{" "}
                    {buddies.length === 1 ? "connection" : "connections"}
                  </p>
                </div>
              </div>

              {/* Search buddies */}
              <button
                onClick={() => showInfoToast("Search coming soon!")}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setBuddiesTab("my-buddies")}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${buddiesTab === "my-buddies"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                My Buddies ({buddies.length})
              </button>
              <button
                onClick={() => setBuddiesTab("activity")}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${buddiesTab === "activity"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Activity
                {buddyActivity.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {buddyActivity.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setBuddiesTab("suggested")}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${buddiesTab === "suggested"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Suggested
                {suggestedBuddies.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs">
                    {suggestedBuddies.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setBuddiesTab("pending")}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${buddiesTab === "pending"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* MY BUDDIES TAB */}
          {buddiesTab === "my-buddies" && (
            <div className="space-y-3">
              {buddies.length === 0 ? (
                <BuddiesEmptyState onExploreEvents={() => setView("explore")} />
              ) : (
                buddies.map((buddy) => {
                  // Calculate last interaction (placeholder)
                  const lastInteraction = "Recently active";

                  return (
                    <div
                      key={buddy.id}
                      className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          {buddy.buddy_profile_picture ? (
                            <img
                              src={buddy.buddy_profile_picture}
                              alt={buddy.buddy_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {getInitial(buddy.user_name)}
                            </div>
                          )}
                          {/* Online indicator */}
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {buddy.buddy_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Buddies since{" "}
                            {new Date(buddy.since).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {lastInteraction}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedConversation({
                                userId: buddy.buddy_id,
                                userName: buddy.buddy_name,
                                userProfilePicture: buddy.buddy_profile_picture,
                              });
                              setView("dm-conversation");
                              fetchDmConversation(buddy.buddy_id);
                              const interval = startDmPolling(buddy.buddy_id);
                              setPollingInterval(interval);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </button>
                          <button
                            onClick={() =>
                              showInfoToast("Profile view coming soon!")
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            title="View Profile"
                          >
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => removeBuddy(buddy.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove Buddy"
                          >
                            <UserX className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ACTIVITY TAB */}
          {buddiesTab === "activity" && (
            <div className="space-y-4">
              {buddyActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-40">👥</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No activity yet
                  </h3>
                  <p className="text-gray-600">
                    When your buddies RSVP to events, you'll see their activity
                    here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buddyActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {getInitial(activity.user_name)}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="font-bold text-gray-900">
                              {activity.user_name}
                            </span>
                            <span className="text-gray-600"> is </span>
                            <span
                              className={`font-bold ${activity.rsvp_status === "going"
                                ? "text-green-600"
                                : activity.rsvp_status === "maybe"
                                  ? "text-yellow-600"
                                  : "text-gray-600"
                                }`}
                            >
                              {activity.rsvp_status === "going"
                                ? "going"
                                : activity.rsvp_status === "maybe"
                                  ? "interested"
                                  : "not going"}
                            </span>
                            <span className="text-gray-600"> to</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">
                            {activity.event_title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const event = events.find(
                              (e) => e.id === activity.event_id,
                            );
                            if (event) {
                              setSelectedEvent(event);
                              setView("event-detail");
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-all"
                        >
                          View Event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUGGESTED BUDDIES TAB */}
          {buddiesTab === "suggested" && (
            <div className="space-y-3">
              {suggestedBuddies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-40">✨</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No suggestions yet
                  </h3>
                  <p className="text-gray-600">
                    Attend more events to find people you might know!
                  </p>
                </div>
              ) : (
                suggestedBuddies.map((suggestion) => (
                  <div
                    key={suggestion.user_id}
                    className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {suggestion.user_profile_picture ? (
                        <img
                          src={suggestion.user_profile_picture}
                          alt={suggestion.user_name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-purple-200"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {getInitial(suggestion.user_name)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {suggestion.user_name}
                        </h3>
                        {suggestion.reasons &&
                          suggestion.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {suggestion.reasons.map((reason, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        {suggestion.mutualBuddies > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.mutualBuddies} mutual{" "}
                            {suggestion.mutualBuddies === 1
                              ? "buddy"
                              : "buddies"}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          sendBuddyRequest(
                            suggestion.user_id,
                            suggestion.user_name,
                          );
                          setSuggestedBuddies(
                            suggestedBuddies.filter(
                              (s) => s.user_id !== suggestion.user_id,
                            ),
                          );
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PENDING REQUESTS TAB */}
          {buddiesTab === "pending" && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <PendingRequestsEmptyState />
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-sm p-4"
                  >
                    <div className="flex items-center gap-4">
                      {request.sender_profile_picture ? (
                        <img
                          src={request.sender_profile_picture}
                          alt={request.sender_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">

                          {getInitial(request.sender_name)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {request.sender_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Sent{" "}
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptBuddyRequest(request.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineBuddyRequest(request.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all font-semibold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>
              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Following Page View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "following") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <ToastNotification />
              <button
                onClick={() => setView("discover")}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Following</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Following Events */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Events ({followingEvents.length})
            </h2>
            {followingEvents.length === 0 ? (
              <FollowingEmptyState
                type="events"
                onExploreEvents={() => setView("explore")}
              />
            ) : (
              <div className="space-y-3">
                {followingEvents.map((follow) => (
                  <div
                    key={follow.id}
                    className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {follow.followed_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Following since{" "}
                        {new Date(follow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleUnfollow("event", follow.followed_id)
                      }
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all font-semibold"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Following Organizers */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Organizers ({followingOrganizers.length})
            </h2>
            {followingOrganizers.length === 0 ? (
              <FollowingEmptyState
                type="organizers"
                onExploreEvents={() => setView("explore")}
              />
            ) : (
              <div className="space-y-3">
                {followingOrganizers.map((follow) => (
                  <div
                    key={follow.id}
                    className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">

                      {getInitial(follow.followed_name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {follow.followed_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Following since{" "}
                        {new Date(follow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleUnfollow("organizer", follow.followed_id)
                      }
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all font-semibold"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>

              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>

              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Messages Inbox View
  // Messages Inbox View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "messages") {
    // Calculate total unread count for badge
    const totalUnreadCount = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <ToastNotification />
              <button
                onClick={() => setView("discover")}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                {totalUnreadCount > 0 && (
                  <p className="text-sm text-indigo-600 font-medium">
                    {totalUnreadCount} unread{" "}
                    {totalUnreadCount === 1 ? "message" : "messages"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {conversations.length === 0 ? (
            <MessagesEmptyState onExploreEvents={() => setView("explore")} />
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const unreadCount = unreadCounts[conv.other_user_id] || 0;
                const isTyping = typingUsers[conv.other_user_id];
                const isOnline = onlineUsers.has(conv.other_user_id);

                return (
                  <div
                    key={conv.other_user_id}
                    onClick={() => {
                      setSelectedConversation({
                        userId: conv.other_user_id,
                        userName: conv.other_user_name,
                        userProfilePicture: conv.other_user_profile_picture,
                      });
                      setView("dm-conversation");
                      fetchDmConversation(conv.other_user_id);
                      const interval = startDmPolling(conv.other_user_id);
                      setPollingInterval(interval);
                    }}
                    className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${unreadCount > 0
                      ? "border-2 border-indigo-200"
                      : "border border-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        {conv.other_user_profile_picture ? (
                          <img
                            src={conv.other_user_profile_picture}
                            alt={conv.other_user_name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200">

                            {getInitial(conv.other_user_name)}
                          </div>
                        )}
                        <OnlineIndicator userId={conv.other_user_id} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name and timestamp */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-semibold ${unreadCount > 0 ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {conv.other_user_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conv.last_message_time)}
                          </span>
                        </div>

                        {/* Last message preview or typing indicator */}
                        <div className="flex items-center justify-between">
                          {isTyping ? (
                            <div className="flex items-center gap-1 text-sm text-indigo-600">
                              <div className="flex gap-0.5">
                                <div
                                  className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                ></div>
                                <div
                                  className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                ></div>
                                <div
                                  className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                ></div>
                              </div>
                              <span className="italic">typing...</span>
                            </div>
                          ) : (
                            <p
                              className={`text-sm truncate ${unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}
                            >
                              {conv.last_message || "No messages yet"}
                            </p>
                          )}

                          {/* Unread badge */}
                          {unreadCount > 0 && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Online status text */}
                        {isOnline && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">
                              Online
                            </span>
                          </div>
                        )}
                      </div>

                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>

              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>

              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // DM Conversation View
  // DM Conversation View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "dm-conversation" && selectedConversation) {
    const isTyping = typingUsers[selectedConversation.userId];
    const isOnline = onlineUsers.has(selectedConversation.userId);

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <ToastNotification />
              <button
                onClick={() => {
                  setView("messages");
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Clickable avatar and name for profile navigation */}
              <div
                onClick={() => {
                  showInfoToast("Profile view coming soon!");
                }}
                className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  {selectedConversation.userProfilePicture ? (
                    <img
                      src={selectedConversation.userProfilePicture}
                      alt={selectedConversation.userName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">

                      {getInitial(selectedConversation.user_name)}
                    </div>
                  )}
                  <OnlineIndicator userId={selectedConversation.userId} />
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {selectedConversation.userName}
                  </h1>
                  {isOnline ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        Online
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {lastSeenTimestamps[selectedConversation.userId]
                        ? `Last seen ${formatMessageTime(lastSeenTimestamps[selectedConversation.userId])}`
                        : "Offline"}
                    </span>
                  )}
                </div>
              </div>

              {/* More options menu */}
              <button
                onClick={() => showInfoToast("More options coming soon!")}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {loadingDms ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" color="purple" />
            </div>
          ) : dmMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Say hello to {selectedConversation.userName}!
              </p>
            </div>
          ) : (
            <>
              {dmMessages.map((msg, index) => {
                const isOwnMessage = msg.sender_id === user.id;
                const prevMsg = index > 0 ? dmMessages[index - 1] : null;
                const shouldGroup = shouldGroupMessage(msg, prevMsg);
                const showTimestamp = !shouldGroup;

                return (
                  <div key={msg.id}>
                    {/* Timestamp separator */}
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {getRelativeTime(msg.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""} ${shouldGroup ? "mt-1" : "mt-3"}`}
                    >
                      {/* Avatar (only show for first message in group) */}
                      {!shouldGroup &&
                        !isOwnMessage &&
                        (msg.sender_profile_picture ? (
                          <img
                            src={msg.sender_profile_picture}
                            alt={msg.sender_name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">

                            {getInitial(msg.sender_name)}
                          </div>
                        ))}

                      {/* Spacer for grouped messages */}
                      {shouldGroup && !isOwnMessage && (
                        <div className="w-8 flex-shrink-0"></div>
                      )}

                      <div
                        className={`flex-1 max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}
                      >
                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2 rounded-2xl break-words ${isOwnMessage
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                            } ${shouldGroup ? (isOwnMessage ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""}`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>

                        {/* Read receipt (only for own messages, last in group) */}
                        {isOwnMessage &&
                          (!dmMessages[index + 1] ||
                            !shouldGroupMessage(
                              dmMessages[index + 1],
                              msg,
                            )) && (
                            <ReadReceipt
                              message={msg}
                              currentUserId={user.id}
                            />
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2 mt-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">

                    {getInitial(selectedConversation.userName)}
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Enhanced Message Input - Sticky */}
        <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
          <div className="max-w-4xl mx-auto flex items-end gap-2">
            {/* Media button */}
            <button
              onClick={() => showInfoToast("Media sharing coming soon!")}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0 mb-1"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Input field */}
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
              <input
                type="text"
                value={newDmMessage}
                onChange={(e) => {
                  setNewDmMessage(e.target.value);
                  handleTyping(selectedConversation.userId);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && newDmMessage.trim()) {
                    e.preventDefault();
                    handleSendDm(
                      selectedConversation.userId,
                      selectedConversation.userName,
                    );
                  }
                }}
                placeholder="Message..."
                className="flex-1 bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-500"
              />

              {/* Emoji button */}
              <button
                onClick={() => showInfoToast("Emoji picker coming soon!")}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={() =>
                handleSendDm(
                  selectedConversation.userId,
                  selectedConversation.userName,
                )
              }
              disabled={!newDmMessage.trim()}
              className={`p-3 rounded-full transition-all flex-shrink-0 mb-1 ${newDmMessage.trim()
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Notifications View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "notifications") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ToastNotification />

        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("discover")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
            </div>
          </div>
        </header>

        {/* Notifications List */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y">
            {/* Sample notifications - Replace with real data later */}
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">John Doe</span> started
                    following you
                  </p>
                  <p className="text-sm text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Music Festival</span> is
                    happening tomorrow
                  </p>
                  <p className="text-sm text-gray-500 mt-1">5 hours ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Sarah Smith</span> liked
                    your post
                  </p>
                  <p className="text-sm text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>

            {/* Empty state if no notifications */}
            {notifications.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4 opacity-40">🔔</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-600">
                  We'll notify you when something happens
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        {/* Include your existing bottom nav here */}
      </div>
    );
  }

  // Event Chat View

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "event-chat" && selectedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <ToastNotification />
              <button
                onClick={() => {
                  setView("event-detail");
                  // Stop polling when leaving chat
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    Event Chat
                  </h1>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-sm text-gray-500">{selectedEvent.title}</p>
              </div>
            </div>
          </div>
        </header>

        <div
          className="max-w-4xl mx-auto px-4 py-6 flex flex-col"
          style={{ height: "calc(100vh - 100px)" }}
        >
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {loadingMessages ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : eventMessages.length === 0 ? (
              <EventChatEmptyState eventName={selectedEvent.title} />
            ) : (
              eventMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${user && user.name === msg.user_name ? "flex-row-reverse" : ""}`}
                >
                  {msg.user_id === user?.id && user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={msg.user_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-200 flex-shrink-0"
                    />
                  ) : msg.user_profile_picture ? (
                    <img
                      src={msg.user_profile_picture}
                      alt={msg.user_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${user && user.name === msg.user_name ? "from-green-600 to-teal-600" : "from-indigo-600 to-indigo-500"} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
                    >

                      {getInitial(msg.user_name)}
                    </div>
                  )}
                  <div
                    className={`flex-1 max-w-md ${user && user.name === msg.user_name ? "items-end" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {msg.user_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                      {user && user.name === msg.user_name && (
                        <button
                          onClick={() =>
                            handleDeleteMessage(msg.id, selectedEvent.id)
                          }
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div
                      className={`${user && user.name === msg.user_name ? "bg-green-600 text-white" : "bg-white"} rounded-2xl px-4 py-2 shadow-sm`}
                    >
                      <p
                        className={`${user && user.name === msg.user_name ? "text-white" : "text-gray-900"}`}
                      >
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          {user && (
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky bottom-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newMessage.trim()) {
                      handleSendMessage(selectedEvent.id);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => handleSendMessage(selectedEvent.id)}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Event Feed View - Redesigned

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "event-feed" && selectedEvent) {
    const handleCreatePost = async () => {
      if (!authToken) {
        showInfoToast("Please login to post");
        return;
      }

      if (!newPost.content && !new(post.media_url || post.image)) {
        showInfoToast("Please add content or upload a photo");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            type: newPost.type,
            content: newPost.content,
            media_url: new(post.media_url || post.image),
          }),
        });

        if (response.ok) {
          setNewPost({ type: "comment", content: "", media_url: "" });
          // Refresh posts after action
          try {
            const [feedPostsResponse, eventPostsResponse] = await Promise.all([
              fetch(`${API_URL}/api/feed-posts`),
              fetch(`${API_URL}/api/posts/event/${selectedEvent.id}`),
            ]);

            let allPosts = [];

            if (feedPostsResponse.ok) {
              const feedData = await feedPostsResponse.json();
              const eventFeedPosts = feedData.filter(
                (post) => post.event_id === selectedEvent.id,
              );
              allPosts = [...eventFeedPosts];
            }

            if (eventPostsResponse.ok) {
              const eventData = await eventPostsResponse.json();
              allPosts = [...allPosts, ...eventData];
            }

            const uniquePosts = allPosts.filter(
              (post, index, self) =>
                index === self.findIndex((p) => p.id === post.id),
            );

            uniquePosts.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
            setPosts(uniquePosts);
          } catch (error) {
            console.error("Error refreshing posts:", error);
          }
          showSuccessToast("Post shared!");
        }
      } catch (error) {
        console.error("Error creating post:", error);
        showErrorToast("Failed to post");
      }
    };

    const handleDeletePost = async (postId) => {
      if (!authToken) {
        showErrorToast("Please login to delete posts");
        return;
      }

      if (!window.confirm("Delete this post?")) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          // Refresh posts after action
          try {
            const [feedPostsResponse, eventPostsResponse] = await Promise.all([
              fetch(`${API_URL}/api/feed-posts`),
              fetch(`${API_URL}/api/posts/event/${selectedEvent.id}`),
            ]);

            let allPosts = [];

            if (feedPostsResponse.ok) {
              const feedData = await feedPostsResponse.json();
              const eventFeedPosts = feedData.filter(
                (post) => post.event_id === selectedEvent.id,
              );
              allPosts = [...eventFeedPosts];
            }

            if (eventPostsResponse.ok) {
              const eventData = await eventPostsResponse.json();
              allPosts = [...allPosts, ...eventData];
            }

            const uniquePosts = allPosts.filter(
              (post, index, self) =>
                index === self.findIndex((p) => p.id === post.id),
            );

            uniquePosts.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
            setPosts(uniquePosts);
          } catch (error) {
            console.error("Error refreshing posts:", error);
          }
          showSuccessToast("Post deleted");
        } else {
          const data = await response.json();
          showErrorToast(data.error || "Failed to delete post");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        showErrorToast("Failed to delete post");
      }
    };

    const handlePostImageUpload = async (file) => {
      if (!file) return;

      setUploadingPost(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setNewPost({ ...newPost, media_url: data.url, type: "photo" });
          showSuccessToast("Photo uploaded!");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showErrorToast("Upload failed");
      } finally {
        setUploadingPost(false);
      }
    };

    const handlePostVideoUpload = async (file) => {
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        showInfoToast("Video file is too large. Maximum size is 50MB.");
        return;
      }

      setUploadingPost(true);
      const formData = new FormData();
      formData.append("video", file);

      try {
        const response = await fetch(`${API_URL}/api/upload/video`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setNewPost({ ...newPost, media_url: data.url, type: "video" });
          showSuccessToast("Video uploaded!");
        } else {
          showErrorToast("Video upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showErrorToast("Video upload failed");
      } finally {
        setUploadingPost(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <ToastNotification />

        {/* Header - Minimal & Clean */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setView("event-detail");
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                <div>
                  <h1 className="font-bold text-gray-900 text-lg">
                    {selectedEvent.title}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      Live Feed
                    </span>
                    <span>•</span>
                    <span>
                      {posts.length} {posts.length === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Create Post - Streamlined */}
          {user && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">

                    {getInitial(user.name)}
                  </div>
                )}
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border-0 focus:outline-none resize-none text-gray-900 placeholder-gray-400"
                  placeholder="Share your experience..."
                  rows={2}
                />
              </div>

              {new(post.media_url || post.image) && (
                <div className="mb-3 relative rounded-lg overflow-hidden">
                  {newPost.type === "video" ? (
                    <video
                      src={new(post.media_url || post.image)}
                      controls
                      className="w-full max-h-80 object-cover"
                    />
                  ) : (
                    <img
                      src={new(post.media_url || post.image)}
                      alt="Upload"
                      className="w-full max-h-80 object-cover"
                    />
                  )}
                  <button
                    onClick={() =>
                      setNewPost({ ...newPost, media_url: "", type: "comment" })
                    }
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-all flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <label
                    className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all"
                    title="Add photo"
                  >
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePostImageUpload(e.target.files[0])}
                      disabled={uploadingPost}
                    />
                  </label>

                  <label
                    className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all"
                    title="Add video"
                  >
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handlePostVideoUpload(e.target.files[0])}
                      disabled={uploadingPost}
                    />
                  </label>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={
                    uploadingPost ||
                    (!newPost.content.trim() && !new(post.media_url || post.image))
                  }
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPost ? "Uploading..." : "Post"}
                </button>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" color="purple" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="📸"
              title="No posts yet"
              description="Be the first to share your experience! Post photos, videos, or updates from this event."
              actionText={null}
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const totalLikes = postReactions[post.id]?.like?.length || 0;
                const totalComments = postComments[post.id]?.length || 0;
                const userLiked = postReactions[post.id]?.like?.some(
                  (r) => r.user_name === user?.name,
                );

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    {/* Post Header */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 mb-3">
                          {post.user_id === user?.id &&
                            user?.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt={post.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                            />
                          ) : post.user_profile_picture ? (
                            <img
                              src={post.user_profile_picture}
                              alt={post.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">

                              {getInitial(post.name)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {post.name || post.user?.name || "Unknown User"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(post.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                        </div>

                        {user && user.name === post.name && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <svg
                              className="w-5 h-5 text-gray-400 hover:text-red-600 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Post Content - Text */}
                      {post.content && (
                        <p className="text-gray-900 mb-3 leading-relaxed">
                          {post.content}
                        </p>
                      )}
                    </div>

                    {/* Post Media - Full Width */}
                    {(post.media_url || post.image) && (
                      <div className="w-full">
                        {post.type === "video" ? (
                          <video
                            src={(post.media_url || post.image)}
                            controls
                            className="w-full max-h-[500px] object-cover bg-black"
                            playsInline
                          />
                        ) : (
                          <img
                            src={(post.media_url || post.image)}
                            alt="Post"
                            className="w-full max-h-[500px] object-cover cursor-pointer"
                            onClick={() => {
                              setModalImage((post.media_url || post.image));
                              setModalEventTitle(post.name + "'s post");
                              setShowImageModal(true);
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Action Bar - Modern Icon Buttons */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button
                            onClick={() => {
                              handleReaction(post.id, "like");
                              if (!postReactions[post.id]) {
                                fetchPostReactions(post.id);
                              }
                            }}
                            className="flex items-center gap-2 group"
                          >
                            <div
                              className={`p-2 rounded-full transition-all ${userLiked ? "bg-red-50" : "hover:bg-gray-100"
                                }`}
                            >
                              <Heart
                                className={`w-5 h-5 transition-all ${userLiked
                                  ? "fill-red-500 text-red-500 scale-110"
                                  : "text-gray-600 group-hover:text-red-500"
                                  }`}
                              />
                            </div>
                            {totalLikes > 0 && (
                              <span
                                className={`text-sm font-semibold ${userLiked ? "text-red-500" : "text-gray-600"
                                  }`}
                              >
                                {totalLikes}
                              </span>
                            )}
                          </button>

                          {/* Comment Button */}
                          <button
                            onClick={() => {
                              setShowComments({
                                ...showComments,
                                [post.id]: !showComments[post.id],
                              });
                              if (!postComments[post.id]) {
                                fetchPostComments(post.id);
                              }
                            }}
                            className="flex items-center gap-2 group"
                          >
                            <div className="p-2 rounded-full hover:bg-gray-100 transition-all">
                              <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            {totalComments > 0 && (
                              <span className="text-sm font-semibold text-gray-600">
                                {totalComments}
                              </span>
                            )}
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={() => {
                              // Share functionality
                              showInfoToast("Share feature coming soon!");
                            }}
                            className="flex items-center gap-2 group"
                          >
                            <div className="p-2 rounded-full hover:bg-gray-100 transition-all">
                              <Share2 className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Like summary */}
                      {totalLikes > 0 && (
                        <div className="text-sm text-gray-600 font-medium mb-2">
                          {totalLikes} {totalLikes === 1 ? "like" : "likes"}
                        </div>
                      )}
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <div className="border-t border-gray-100 px-4 py-3">
                        {/* Add Comment Input */}
                        {user && (
                          <div className="flex gap-2 mb-4">
                            {user?.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">

                                {getInitial(user.name)}
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 bg-gray-50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              onKeyPress={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.target.value.trim()
                                ) {
                                  handleAddComment(post.id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Display Comments */}
                        {postComments[post.id]?.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-4">
                            No comments yet. Be the first!
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {postComments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">

                                  {getInitial(comment.name)}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-2xl px-3 py-2">
                                    <div className="font-semibold text-sm text-gray-900">
                                      {comment.name}
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {comment.content}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 px-3">
                                    <span className="text-xs text-gray-400">
                                      {new Date(
                                        comment.created_at,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setReplyingTo(
                                          replyingTo === comment.id
                                            ? null
                                            : comment.id,
                                        )
                                      }
                                      className="text-xs text-gray-500 hover:text-indigo-600 font-semibold"
                                    >
                                      Reply
                                    </button>
                                    {user &&
                                      user.name === comment.name && (
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              comment.id,
                                              post.id,
                                            )
                                          }
                                          className="text-xs text-gray-500 hover:text-red-600 font-semibold"
                                        >
                                          Delete
                                        </button>
                                      )}
                                  </div>

                                  {/* Reply Input */}
                                 {replyingToFeed === comment.id && (
  <div className="ml-10 mt-2 flex gap-2">
    <input
      type="text"
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === "Enter" && replyText.trim()) {
          handleAddFeedComment(post.id, comment.id);
        }
      }}
      placeholder="Write a reply..."
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      autoFocus
    />
    <button
      onClick={() => handleAddFeedComment(post.id, comment.id)}
      disabled={!replyText.trim()}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <Send className="w-4 h-4" />
      <span className="hidden sm:inline">Reply</span>
    </button>
    <button
      onClick={() => {
        setReplyingToFeed(null);
        setReplyText('');
      }}
      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
    >
      Cancel
    </button>
  </div>
)}
                                  {/* Replies */}
{comment.replies?.map((reply) => (
  <div key={reply.id} className="ml-10 mt-2 flex gap-2">
    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
      {getInitial(reply.name)}
    </div>
    <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-gray-900">
          {reply.name}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(reply.created_at).toLocaleTimeString()}
        </span>
        {user && user.name === reply.name && (
          <button
            onClick={() => handleDeleteFeedComment(reply.id, post.id)}
            className="text-red-600 hover:text-red-800 text-xs ml-auto"
          >
            Delete
          </button>
        )}
      </div>
      <p className="text-sm text-gray-900">
        {reply.content}
      </p>
    </div>
  </div>
))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>
              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1">Create</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("my-events");
                  } else {
                    showInfoToast("Please login to view events");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Fetch nearby events for My Events discovery
  const fetchNearbyEvents = () => {
    // Filter events in Nairobi area (you can enhance with real geolocation)
    const nearby = events
      .filter((e) => {
        const eventDate = new Date(e.date);
        const now = new Date();
        return eventDate > now; // Only upcoming events
      })
      .slice(0, 3);

    setNearbyEvents(nearby);
  };

  // Fetch popular events
  const fetchPopularEvents = () => {
    const popular = [...events]
      .filter((e) => {
        const eventDate = new Date(e.date);
        const now = new Date();
        return eventDate > now;
      })
      .sort((a, b) => (b.attending || 0) - (a.attending || 0))
      .slice(0, 3);

    setPopularEvents(popular);
  };

  // Fetch events that buddies are attending
  const fetchFriendEvents = () => {
    if (!user || buddies.length === 0) {
      setFriendEvents([]);
      return;
    }

    const friendEventIds = new Set();

    // Find events where buddies are going
    Object.entries(eventRSVPs).forEach(([eventId, rsvps]) => {
      const goingList = rsvps.going || [];
      const hasBuddy = goingList.some((attendee) =>
        buddies.some(
          (buddy) =>
            buddy.buddy_id === attendee.user_id ||
            buddy.user_id === attendee.user_id,
        ),
      );

      if (hasBuddy) {
        friendEventIds.add(parseInt(eventId));
      }
    });

    const friendEventsList = events
      .filter((e) => friendEventIds.has(e.id))
      .filter((e) => {
        const eventDate = new Date(e.date);
        const now = new Date();
        return eventDate > now;
      })
      .slice(0, 3);

    setFriendEvents(friendEventsList);
  };

  // Organizer Dashboard View
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "organizer") {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
            <UserIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Login Required
            </h2>
            <p className="text-gray-500 mb-6">
              Please login to access the organizer dashboard
            </p>
            <div className="flex gap-3">
              <ToastNotification />
              <button
                onClick={() => setView("login")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold hover:shadow-sm transition-all"
              >
                Login
              </button>
              <button
                onClick={() => setView("discover")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    const myEvents = events.filter((e) => e.organizer === user.name);


    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Organizer Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setView("discover")}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Stats Overview - Modern Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Total Events
                </span>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {events.filter((e) => e.organizer_id === user?.id).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Total Attendees
                </span>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {events
                  .filter((e) => e.organizer_id === user?.id)
                  .reduce((sum, event) => sum + (event.attendees || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Across all events</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Total Views
                </span>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>

          {/* Event Poster Upload - Compact with Camera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: Upload Preview or Placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Poster
              </label>
              {newEvent.image &&
                newEvent.image !==
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800" ? (
                <div
                  className="relative rounded-lg overflow-hidden border border-gray-200"
                  style={{ minHeight: "500px" }}
                >
                  <img
                    src={newEvent.image}
                    alt="Event poster"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewEvent({
                        ...newEvent,
                        image:
                          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
                      })
                    }
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg hover:bg-white transition-all shadow-sm"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                  style={{ height: "280px" }}
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">No image yet</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Upload Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Options
              </label>
              <div className="space-y-2">
                {/* Upload from Computer */}
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      Upload Photo
                    </p>
                    <p className="text-xs text-gray-500">From your device</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </label>

                {/* Take Photo */}
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      Take Photo
                    </p>
                    <p className="text-xs text-gray-500">Use your camera</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </label>

                {uploadingImage && (
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <p className="text-sm text-indigo-700">Uploading...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => {
                    setNewEvent({ ...newEvent, title: e.target.value });
                    if (eventFormErrors.title) {
                      setEventFormErrors({ ...eventFormErrors, title: "" });
                    }
                  }}
                  className={`w-full px-4 py-2.5 border ${eventFormErrors.title ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Amazing Event Name"
                  required
                />
                {eventFormErrors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {eventFormErrors.title}
                  </p>
                )}
              </div>

              {/* Category and Privacy - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="music">Music</option>
                    <option value="sports">Sports</option>
                    <option value="arts">Arts</option>
                    <option value="food">Food & Drink</option>
                    <option value="business">Business</option>
                    <option value="tech">Technology</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Privacy *
                  </label>
                  <select
                    value={newEvent.privacy}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, privacy: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="public">Public</option>
                    <option value="invite">Invite Only</option>
                  </select>
                </div>
              </div>

              {/* Price - Smaller */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="text"
                  value={newEvent.price}
                  onChange={(e) => {
                    setNewEvent({ ...newEvent, price: e.target.value });
                    if (eventFormErrors.price) {
                      setEventFormErrors({ ...eventFormErrors, price: "" });
                    }
                  }}
                  className={`w-full md:w-64 px-4 py-2.5 border ${eventFormErrors.price ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="KES 2,000 or Free"
                  required
                />
                {eventFormErrors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {eventFormErrors.price}
                  </p>
                )}
              </div>

              {/* Date and Time - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => {
                      setNewEvent({ ...newEvent, date: e.target.value });
                      if (eventFormErrors.date) {
                        setEventFormErrors({ ...eventFormErrors, date: "" });
                      }
                    }}
                    className={`w-full px-4 py-2.5 border ${eventFormErrors.date ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    required
                  />
                  {eventFormErrors.date && (
                    <p className="mt-1 text-sm text-red-600">
                      {eventFormErrors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => {
                      setNewEvent({ ...newEvent, time: e.target.value });
                      if (eventFormErrors.time) {
                        setEventFormErrors({ ...eventFormErrors, time: "" });
                      }
                    }}
                    className={`w-full px-4 py-2.5 border ${eventFormErrors.time ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    required
                  />
                  {eventFormErrors.time && (
                    <p className="mt-1 text-sm text-red-600">
                      {eventFormErrors.time}
                    </p>
                  )}
                </div>
              </div>

              {/* Location - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => {
                    setNewEvent({ ...newEvent, location: e.target.value });
                    if (eventFormErrors.location) {
                      setEventFormErrors({ ...eventFormErrors, location: "" });
                    }
                  }}
                  className={`w-full px-4 py-2.5 border ${eventFormErrors.location ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Venue name or address"
                  required
                />
                {eventFormErrors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {eventFormErrors.location}
                  </p>
                )}
              </div>

              {/* Description - Smaller Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows="3"
                  placeholder="Tell people about your event..."
                />
              </div>

              {/* Lineup - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lineup (optional)
                </label>
                <input
                  type="text"
                  value={newEvent.lineup}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, lineup: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Artist 1, Artist 2, Artist 3"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={
                  !newEvent.title ||
                  !newEvent.date ||
                  !newEvent.time ||
                  !newEvent.location ||
                  !newEvent.price ||
                  uploadingImage
                }
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    <span>Publish Event</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setView("discover")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Events</h2>

            {myEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No events created yet</p>
                <p className="text-sm">
                  Create your first event using the form above!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-all"
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(event.date).toLocaleDateString()} •{" "}
                        {event.location}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attending}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {event.attending * 3}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              <button
                onClick={() => {
                  setView("discover");
                  fetchFeedPosts();
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
              >
                {" "}
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs font-medium">Feed</span>
              </button>
              <button
                onClick={() => setView("explore")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Search className="w-6 h-6" />
                <span className="text-xs font-medium">Explore</span>
              </button>
              <button
                onClick={() => {
                  if (user) {
                    setView("organizer");
                  } else {
                    showInfoToast("Please login to create");
                    setView("login");
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900 group relative"
              >
                {/* Pulsing glow effect */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-indigo-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>

                {/* Main button with animation */}
                <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center -mt-7 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 group-active:scale-95">
                  <Plus className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />

                  {/* Contextual label on hover */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {user ? "Create Event" : "Login to Create"}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>

                <span className="text-xs font-semibold mt-1 group-hover:text-indigo-600 transition-colors">
                  Create
                </span>
              </button>
              <button
                onClick={() => setView("my-events")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Authentication Gate - ADD IT HERE, AFTER organizer view closes
  if (!user && !authToken && view !== "login" && view !== "signup") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <ToastNotification />
          <Calendar className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Happening
          </h2>
          <p className="text-gray-500 mb-6">
            Please log in or sign up to continue
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setView("login")}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Login
            </button>
            <button
              onClick={() => setView("signup")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Buddy Activity Modal - Global */}
      <BuddyActivityModal
        show={showBuddyActivity}
        onClose={() => setShowBuddyActivity(false)}
      />

      <ScrollToTop />

      <BottomNav
        view={view}
        user={user}
        setView={setView}
        fetchFeedPosts={fetchFeedPosts}
      />
    </>
  );
}

// Bottom Navigation Component (rendered when needed)
const BottomNav = ({ view, user, setView, fetchFeedPosts }) => {

  if (view === "login" || view === "signup") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <ToastNotification />
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => {
              setView("discover");
              fetchFeedPosts();
            }}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Feed</span>
          </button>

          {/* Explore */}
          <button
            onClick={() => setView("explore")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${view === "explore"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Search className="w-6 h-6" />
            <span className="text-xs font-medium">Explore</span>
          </button>

          {/* Create */}
          <button
            onClick={() => {
              if (!user) {
                alert("Please login to create");
                setView("login");
              } else {
                setView("organizer");
              }
            }}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-900"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center -mt-6 shadow-sm">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium mt-1">Create</span>
          </button>

          {/* Events */}
          <button
            onClick={() => {
              if (!user) {
                alert("Please login to view events");
                setView("login");
              } else {
                setView("my-events");
              }
            }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${view === "my-events"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Events</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setView("profile")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500"
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-gray-300"
              />
            ) : (
              <UserIcon className="w-6 h-6" />
            )}
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default App;
