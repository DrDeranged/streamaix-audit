import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Image as ImageIcon, 
  Hash, 
  TrendingUp,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
}

const TOPICS = [
  "DeFi", "NFTs", "AI", "Trading", "DAOs", "Memes", 
  "News", "Research", "Alpha", "Predictions"
];

export default function SocialCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"trending" | "for-you" | "following">("trending");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Fetch feed
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations/feed", activeTab, selectedTopic],
    queryFn: async () => {
      const params = new URLSearchParams({
        tab: activeTab,
        limit: "20",
        offset: "0"
      });
      if (selectedTopic) params.append("topic", selectedTopic);
      
      const response = await fetch(`/api/conversations/feed?${params}`);
      if (!response.ok) throw new Error("Failed to fetch feed");
      return response.json();
    }
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; tags?: string[]; imageUrl?: string }) => {
      return apiRequest("/api/conversations", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your conversation has been shared with the community."
      });
      setNewPostContent("");
      setNewPostTags([]);
      setImageUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/feed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest(`/api/conversations/${conversationId}/like`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/feed"] });
    }
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Empty post",
        description: "Please write something before posting.",
        variant: "destructive"
      });
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      tags: newPostTags.length > 0 ? newPostTags : undefined,
      imageUrl: imageUrl || undefined
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newPostTags.includes(tagInput.trim())) {
      setNewPostTags([...newPostTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewPostTags(newPostTags.filter(t => t !== tag));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Social Center
          </h1>
          <p className="text-slate-400">
            Connect, share insights, and engage with the StreamAiX community
          </p>
        </div>

        {/* Post Composer */}
        <Card className="neural-glass mb-6 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Share Your Thoughts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's happening in crypto? Share your insights..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[120px] bg-slate-900/50 border-slate-700 focus:border-purple-500 resize-none"
              data-testid="input-post-content"
            />

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add topic tags (e.g., DeFi, Trading)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="bg-slate-900/50 border-slate-700 focus:border-purple-500"
                  data-testid="input-tag"
                />
                <Button 
                  onClick={handleAddTag} 
                  variant="outline" 
                  size="icon"
                  className="border-slate-700 hover:border-purple-500"
                  data-testid="button-add-tag"
                >
                  <Hash className="w-4 h-4" />
                </Button>
              </div>
              {newPostTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newPostTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    >
                      #{tag}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Image URL */}
            <Input
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-slate-900/50 border-slate-700 focus:border-purple-500"
              data-testid="input-image-url"
            />

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-400 hover:text-purple-400"
                  data-testid="button-attach-image"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-400 hover:text-purple-400"
                  data-testid="button-add-topic"
                >
                  <Hash className="w-5 h-5" />
                </Button>
              </div>
              <Button 
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending || !newPostContent.trim()}
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600"
                data-testid="button-post"
              >
                {createPostMutation.isPending ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Topic Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTopic === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTopic(null)}
              className={selectedTopic === null 
                ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" 
                : "border-slate-700 text-slate-400"
              }
              data-testid="button-topic-all"
            >
              All Topics
            </Button>
            {TOPICS.map(topic => (
              <Button
                key={topic}
                variant={selectedTopic === topic ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTopic(topic)}
                className={selectedTopic === topic 
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" 
                  : "border-slate-700 text-slate-400"
                }
                data-testid={`button-topic-${topic.toLowerCase()}`}
              >
                #{topic}
              </Button>
            ))}
          </div>
        </div>

        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-900/50">
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500"
              data-testid="tab-trending"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="for-you"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500"
              data-testid="tab-for-you"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500"
              data-testid="tab-following"
            >
              <Users className="w-4 h-4 mr-2" />
              Following
            </TabsTrigger>
          </TabsList>

          {/* Feed Content */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <Card className="neural-glass border-slate-800/50">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400 mb-2">No conversations yet</p>
                  <p className="text-sm text-slate-500">Be the first to start a discussion!</p>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  onLike={() => likeMutation.mutate(conversation.id)}
                />
              ))
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function ConversationCard({ 
  conversation, 
  onLike 
}: { 
  conversation: Conversation; 
  onLike: () => void;
}) {
  return (
    <Card className="neural-glass border-slate-800/50 hover:border-purple-500/30 transition-all duration-300" data-testid={`card-conversation-${conversation.id}`}>
      <CardContent className="pt-6">
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="border-2 border-purple-500/30">
            <AvatarImage src={conversation.author.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500">
              {conversation.author.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white" data-testid={`text-author-${conversation.id}`}>
                @{conversation.author.username}
              </h3>
              <span className="text-sm text-slate-500">
                {new Date(conversation.createdAt).toLocaleDateString()}
              </span>
            </div>
            {conversation.author.bio && (
              <p className="text-xs text-slate-400 mt-1">{conversation.author.bio}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-slate-200 mb-4 whitespace-pre-wrap" data-testid={`text-content-${conversation.id}`}>
          {conversation.content}
        </p>

        {/* Image */}
        {conversation.imageUrl && (
          <img 
            src={conversation.imageUrl} 
            alt="Post image" 
            className="w-full rounded-lg mb-4 max-h-96 object-cover border border-slate-800"
          />
        )}

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {conversation.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="bg-purple-500/20 text-purple-300 text-xs"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="my-4 bg-slate-800" />

        {/* Engagement Actions */}
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={`gap-2 ${conversation.isLiked ? 'text-pink-500 hover:text-pink-400' : 'text-slate-400 hover:text-pink-400'}`}
            data-testid={`button-like-${conversation.id}`}
          >
            <Heart className={`w-4 h-4 ${conversation.isLiked ? 'fill-current' : ''}`} />
            <span data-testid={`text-likes-${conversation.id}`}>{conversation.likesCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-400 hover:text-cyan-400"
            data-testid={`button-comment-${conversation.id}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span data-testid={`text-comments-${conversation.id}`}>{conversation.commentsCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-400 hover:text-purple-400"
            data-testid={`button-share-${conversation.id}`}
          >
            <Share2 className="w-4 h-4" />
            <span data-testid={`text-shares-${conversation.id}`}>{conversation.sharesCount}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
