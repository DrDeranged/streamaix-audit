import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CustomModal } from "@/components/ui/custom-modal";
import { 
  Users, 
  TrendingUp, 
  Eye,
  CheckCircle,
  Twitter,
  Globe,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LineChart,
  Activity,
  DollarSign,
  Lightbulb
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DatabaseAvatar {
  id: string;
  name: string;
  handle: string;
  bio: string;
  expertise: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  followerCount: number;
  verificationStatus: string;
  netWorth: string | null;
  portfolioRoi: number | null;
  accuracyPercentage: number | null;
  influenceScore: number | null;
  investmentCount: number | null;
  notableInvestments: string[];
  primaryInterests: string[];
  philosophicalViews: string[];
  recentThoughts: string[];
}

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getAvatarGradient = (name: string) => {
  const gradients: Record<string, string> = {
    'Naval Ravikant': 'from-slate-950 via-purple-950 to-slate-950',
    'Vitalik Buterin': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Michael Saylor': 'from-slate-950 via-purple-950 to-cyan-950',
    'Brian Armstrong': 'from-purple-950 via-cyan-950 to-teal-950',
    'Changpeng Zhao': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Cathie Wood': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'default': 'from-slate-950 via-gray-950 to-zinc-950'
  };
  return gradients[name] || gradients.default;
};

export function KnowledgeAvatarsV2() {
  const [selectedAvatar, setSelectedAvatar] = useState<DatabaseAvatar | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const avatarsPerPage = 6;

  const { data: avatarsData, isLoading } = useQuery<{ success: boolean; data: DatabaseAvatar[] }>({
    queryKey: ['/api/avatars']
  });

  const avatars = avatarsData?.data || [];
  const totalPages = Math.ceil(avatars.length / avatarsPerPage);
  const currentAvatars = avatars.slice(
    currentPage * avatarsPerPage,
    (currentPage + 1) * avatarsPerPage
  );

  if (isLoading) {
    return (
      <section className="w-full py-20 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-muted-foreground">Loading knowledge avatars...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="w-full py-20 px-4 relative overflow-hidden bg-background/50">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
              Knowledge Avatars
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn from crypto's most influential thought leaders
            </p>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentAvatars.map((avatar) => (
              <Card
                key={avatar.id}
                className="group cursor-pointer hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 border-gray-700/50 bg-card/80 backdrop-blur"
                onClick={() => setSelectedAvatar(avatar)}
                data-testid={`card-avatar-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar Image */}
                    <Avatar className="h-16 w-16 ring-2 ring-blue-500/30">
                      <AvatarImage 
                        src={avatar.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatar.name}`}
                        alt={avatar.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {avatar.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{avatar.name}</h3>
                        {avatar.verificationStatus === 'verified' && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">@{avatar.handle}</p>
                      <Badge variant="secondary" className="text-xs">
                        {avatar.expertise}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Followers</p>
                      <p className="font-semibold text-sm">{formatNumber(avatar.followerCount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className="font-semibold text-sm text-green-400">
                        +{avatar.portfolioRoi || 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-semibold text-sm">{avatar.accuracyPercentage || 0}%</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    data-testid={`button-view-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Avatar Detail Modal */}
      <CustomModal
        isOpen={!!selectedAvatar}
        onClose={() => setSelectedAvatar(null)}
        maxWidth="max-w-6xl"
      >
        {selectedAvatar && (
          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <div className="relative mb-8">
              <div className={`h-32 bg-gradient-to-r ${getAvatarGradient(selectedAvatar.name)} rounded-lg relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/40" />
              </div>
              <div className="absolute -bottom-12 left-8">
                <Avatar className="h-24 w-24 ring-4 ring-card border-2 border-white/20 shadow-2xl">
                  <AvatarImage 
                    src={selectedAvatar.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedAvatar.name}`}
                    alt={selectedAvatar.name}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {selectedAvatar.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {selectedAvatar.verificationStatus === 'verified' && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-12 px-4 mb-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-3xl font-bold mb-2">{selectedAvatar.name}</h3>
                  <p className="text-lg text-muted-foreground mb-3">@{selectedAvatar.handle}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {selectedAvatar.expertise}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      Influence: {selectedAvatar.influenceScore || 70}
                    </Badge>
                  </div>
                  <p className="text-base text-muted-foreground max-w-2xl">
                    {selectedAvatar.bio}
                  </p>
                </div>
                <div className="flex gap-3">
                  {selectedAvatar.twitterHandle && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://twitter.com/${selectedAvatar.twitterHandle}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {selectedAvatar.websiteUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedAvatar.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Analytics */}
            <div className="px-4 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Performance Analytics
                </h4>
                <Badge variant="outline">v2.2</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Followers */}
                <Card className="bg-gradient-to-br from-blue-950/40 to-blue-900/20 border-blue-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-blue-300">{formatNumber(selectedAvatar.followerCount)}</p>
                    <p className="text-sm text-blue-200/80 mt-1">Total Followers</p>
                    <p className="text-xs text-blue-300/60 mt-1">+12.3% this month</p>
                  </CardContent>
                </Card>

                {/* Portfolio ROI */}
                <Card className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border-emerald-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-emerald-300">+{selectedAvatar.portfolioRoi || 120}%</p>
                    <p className="text-sm text-emerald-200/80 mt-1">Portfolio ROI</p>
                    <p className="text-xs text-emerald-300/60 mt-1">All-time returns</p>
                  </CardContent>
                </Card>

                {/* Prediction Accuracy */}
                <Card className="bg-gradient-to-br from-purple-950/40 to-purple-900/20 border-purple-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-purple-300">{selectedAvatar.accuracyPercentage || 74}%</p>
                    <p className="text-sm text-purple-200/80 mt-1">Prediction Accuracy</p>
                    <p className="text-xs text-purple-300/60 mt-1">Last 100 predictions</p>
                  </CardContent>
                </Card>

                {/* Net Worth */}
                <Card className="bg-gradient-to-br from-amber-950/40 to-amber-900/20 border-amber-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold text-amber-300">{selectedAvatar.netWorth || 'Undisclosed'}</p>
                    <p className="text-sm text-amber-200/80 mt-1">Assets Under Management</p>
                    <p className="text-xs text-amber-300/60 mt-1">Public portfolio value</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Investment Portfolio */}
            {selectedAvatar.notableInvestments && selectedAvatar.notableInvestments.length > 0 && (
              <div className="px-4 mb-8">
                <h4 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <LineChart className="h-5 w-5 text-emerald-400" />
                  Investment Portfolio
                </h4>
                <Card className="bg-card/60 border-border">
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedAvatar.notableInvestments.slice(0, 8).map((investment, idx) => (
                        <div 
                          key={idx}
                          className="px-3 py-2 bg-gradient-to-br from-blue-950/30 to-purple-950/20 border border-blue-500/20 rounded-lg"
                        >
                          <p className="font-semibold text-sm truncate">{investment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Primary Interests */}
            {selectedAvatar.primaryInterests && selectedAvatar.primaryInterests.length > 0 && (
              <div className="px-4 mb-8">
                <h4 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  Primary Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAvatar.primaryInterests.map((interest, idx) => (
                    <Badge key={idx} variant="outline" className="bg-amber-950/20 text-amber-300 border-amber-500/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Philosophical Views */}
            {selectedAvatar.philosophicalViews && selectedAvatar.philosophicalViews.length > 0 && (
              <div className="px-4 mb-8">
                <h4 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Key Philosophy
                </h4>
                <div className="space-y-3">
                  {selectedAvatar.philosophicalViews.slice(0, 3).map((view, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-cyan-500/30">
                      <p className="text-sm text-muted-foreground italic">"{view}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Thoughts */}
            {selectedAvatar.recentThoughts && selectedAvatar.recentThoughts.length > 0 && (
              <div className="px-4 mb-4">
                <h4 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Recent Thoughts
                </h4>
                <div className="space-y-3">
                  {selectedAvatar.recentThoughts.slice(0, 3).map((thought, idx) => (
                    <Card key={idx} className="bg-card/60 border-border hover:border-purple-500/30 transition-colors">
                      <CardContent className="p-4">
                        <p className="text-sm text-foreground">{thought}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CustomModal>
    </>
  );
}
