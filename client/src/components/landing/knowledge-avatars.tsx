import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  Eye,
  UserPlus,
  ExternalLink,
  CheckCircle,
  Building2,
  MessageCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DatabaseAvatar {
  id: string;
  name: string;
  handle: string;
  bio: string;
  expertise: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  followerCount: number;
  verificationStatus: string;
  primaryInterests: string[];
  investmentFocus: string[];
  notableInvestments: string[];
  philosophicalViews: string[];
  recentThoughts: string[];
}

const getAvatarGradient = (name: string) => {
  const gradients: Record<string, string> = {
    'Naval Ravikant': 'from-blue-600 via-purple-600 to-blue-800',
    'Vitalik Buterin': 'from-purple-600 via-blue-600 to-purple-800',
    'Michael Saylor': 'from-orange-600 via-red-600 to-orange-800',
    'Brian Armstrong': 'from-blue-600 via-cyan-600 to-blue-800',
    'Changpeng Zhao': 'from-yellow-500 via-orange-600 to-red-600',
    'Cathie Wood': 'from-pink-600 via-purple-600 to-pink-800',
    'Tyler Winklevoss': 'from-green-600 via-teal-600 to-green-800',
    'Cameron Winklevoss': 'from-indigo-600 via-blue-600 to-indigo-800',
    'Sam Bankman-Fried': 'from-red-600 via-pink-600 to-red-800',
    'Andre Cronje': 'from-emerald-600 via-green-600 to-emerald-800'
  };
  return gradients[name] || 'from-gray-600 via-gray-700 to-gray-800';
};

const formatFollowerCount = (count: number) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export function KnowledgeAvatars() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch real avatars from API
  const { data: avatarsResponse, isLoading } = useQuery<{ avatars: DatabaseAvatar[] }>({
    queryKey: ['/api/avatars'],
  });

  const avatars = avatarsResponse?.avatars || [];
  const itemsPerView = 3;
  const maxIndex = Math.max(0, avatars.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleFollow = async (avatarId: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to follow avatars",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/avatars/${avatarId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({ title: "Success", description: "Avatar followed successfully!" });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to follow avatar",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <section id="profiles" className="py-20 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse text-xl text-muted-foreground">Loading crypto entrepreneurs...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="profiles" className="py-20 bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Crypto Entrepreneurs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Follow the world's leading crypto visionaries and access Bloomberg Terminal-level intelligence
          </p>
        </motion.div>
        
        {/* Carousel Container */}
        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          <Button
            onClick={prevSlide}
            size="icon"
            variant="ghost"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            onClick={nextSlide}
            size="icon"
            variant="ghost"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          {/* Carousel Content */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {avatars.map((avatar, index) => (
                <motion.div
                  key={avatar.id}
                  className="flex-none w-1/3 px-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <Card className="group cursor-pointer bg-card/60 backdrop-blur-sm border-glass-border hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                        <div className="relative">
                          <div className={`h-32 bg-gradient-to-r ${getAvatarGradient(avatar.name)} opacity-90`} />
                          <div className="absolute -bottom-8 left-6">
                            <Avatar className="w-16 h-16 ring-4 ring-card border-2 border-white/20">
                              <AvatarImage 
                                src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                                alt={`${avatar.name} avatar`}
                              />
                              <AvatarFallback className="text-lg font-bold">
                                {avatar.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {avatar.verificationStatus === 'verified' && (
                              <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-blue-500 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        <CardContent className="pt-12 pb-6 px-6">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                {avatar.name}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {avatar.expertise}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">@{avatar.handle}</p>
                          </div>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Users className="h-4 w-4 text-blue-500 mr-1" />
                              </div>
                              <div className="text-sm font-bold text-foreground">
                                {formatFollowerCount(avatar.followerCount)}
                              </div>
                              <div className="text-xs text-muted-foreground">Followers</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Building2 className="h-4 w-4 text-green-500 mr-1" />
                              </div>
                              <div className="text-sm font-bold text-foreground">
                                {avatar.notableInvestments?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Investments</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                              </div>
                              <div className="text-sm font-bold text-foreground">
                                {avatar.primaryInterests?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Interests</div>
                            </div>
                          </div>
                          
                          {/* Recent Thought */}
                          {avatar.recentThoughts && avatar.recentThoughts.length > 0 && (
                            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground italic line-clamp-2">
                                "{avatar.recentThoughts[0]}"
                              </p>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(avatar.id);
                              }}
                              size="sm"
                              className={`flex-1 bg-gradient-to-r ${getAvatarGradient(avatar.name)} hover:opacity-90 text-white transition-all duration-300`}
                              data-testid={`button-follow-${avatar.name.toLowerCase().replace(' ', '-')}`}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Follow
                            </Button>
                            <Button
                              onClick={(e) => e.stopPropagation()}
                              size="sm"
                              variant="outline"
                              className="px-3"
                              data-testid={`button-view-${avatar.name.toLowerCase().replace(' ', '-')}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    
                    {/* Popup Modal Content */}
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-glass-border">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="relative">
                          <div className={`h-32 bg-gradient-to-r ${getAvatarGradient(avatar.name)} opacity-90 rounded-t-lg`} />
                          <div className="absolute -bottom-8 left-6">
                            <Avatar className="w-20 h-20 ring-4 ring-card border-2 border-white/20">
                              <AvatarImage 
                                src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                                alt={`${avatar.name} avatar`}
                              />
                              <AvatarFallback className="text-xl font-bold">
                                {avatar.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {avatar.verificationStatus === 'verified' && (
                              <CheckCircle className="absolute -top-1 -right-1 h-6 w-6 text-blue-500 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="pt-8 px-2">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-foreground">{avatar.name}</h3>
                              <p className="text-muted-foreground">@{avatar.handle}</p>
                              <Badge variant="secondary" className="mt-2">
                                {avatar.expertise}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleFollow(avatar.id)}
                                className={`bg-gradient-to-r ${getAvatarGradient(avatar.name)} hover:opacity-90 text-white`}
                                data-testid={`button-follow-modal-${avatar.name.toLowerCase().replace(' ', '-')}`}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Follow
                              </Button>
                              <Link href={`/avatar/${avatar.handle}`}>
                                <Button variant="outline" data-testid={`button-profile-${avatar.name.toLowerCase().replace(' ', '-')}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Profile
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          {/* Bio */}
                          <p className="text-muted-foreground mb-6">{avatar.bio}</p>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/20 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {formatFollowerCount(avatar.followerCount)}
                              </div>
                              <div className="text-sm text-muted-foreground">Followers</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {avatar.notableInvestments?.length || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">Investments</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {avatar.primaryInterests?.length || 0}
                              </div>
                              <div className="text-sm text-muted-foreground">Interests</div>
                            </div>
                          </div>
                          
                          {/* Notable Investments */}
                          {avatar.notableInvestments && avatar.notableInvestments.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                                <Building2 className="h-5 w-5 mr-2" />
                                Notable Investments
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {avatar.notableInvestments.slice(0, 8).map((investment, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-muted/30">
                                    {investment}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Recent Thoughts */}
                          {avatar.recentThoughts && avatar.recentThoughts.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                                <MessageCircle className="h-5 w-5 mr-2" />
                                Recent Thoughts
                              </h4>
                              <div className="space-y-3">
                                {avatar.recentThoughts.slice(0, 3).map((thought, idx) => (
                                  <div key={idx} className="p-3 bg-muted/20 rounded-lg border-l-4 border-primary/30">
                                    <p className="text-sm text-muted-foreground italic">"{thought}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}