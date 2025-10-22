import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/landing/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { 
  FileText, 
  Calendar,
  Search,
  Filter,
  Sparkles,
  Video,
  Mic,
  Radio,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";

export default function Summaries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['/api/summaries'],
  });

  const filteredSummaries = (summaries as any[])
    .filter(s => {
      const matchesSearch = !searchTerm || 
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = contentTypeFilter === "all" || s.contentType === contentTypeFilter;
      const matchesStatus = statusFilter === "all" || s.processingStatus === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getContentIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'podcast': return <Mic className="w-4 h-4" />;
      case 'livestream': return <Radio className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'processing': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              AI-Processed Content
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-orbitron font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
              Content Summaries
            </span>
          </h1>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Browse all AI-processed videos, podcasts, and livestreams transformed into actionable insights
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search summaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 neural-glass"
                data-testid="input-search-summaries"
              />
            </div>

            {/* Content Type Filter */}
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 neural-glass" data-testid="select-content-type">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="podcast">Podcasts</SelectItem>
                <SelectItem value="livestream">Livestreams</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 neural-glass" data-testid="select-status">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {filteredSummaries.length} of {(summaries as any[]).length} summaries
            </p>
            <Link href="/create-summary">
              <Button variant="outline" className="gap-2" data-testid="button-create-new">
                <Sparkles className="w-4 h-4" />
                Create New
              </Button>
            </Link>
          </div>
        </div>

        {/* Summaries Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-pulse">Loading summaries...</div>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || contentTypeFilter !== "all" || statusFilter !== "all" 
                ? "No summaries match your filters" 
                : "No summaries yet"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || contentTypeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first AI-processed summary"}
            </p>
            {!searchTerm && contentTypeFilter === "all" && statusFilter === "all" && (
              <Link href="/create-summary">
                <Button data-testid="button-create-first">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create First Summary
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSummaries.map((summary: any) => (
              <Card 
                key={summary.id} 
                className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer group"
                data-testid={`card-summary-${summary.id}`}
              >
                <Link href={`/summary/${summary.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                      >
                        <span className="flex items-center gap-1">
                          {getContentIcon(summary.contentType)}
                          {summary.contentType || 'video'}
                        </span>
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={getStatusColor(summary.processingStatus)}
                      >
                        {summary.processingStatus || 'pending'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 text-white group-hover:text-cyan-400 transition-colors">
                      {summary.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {summary.description || summary.tldrSummary || summary.executiveSummary || 'AI-processed content'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Tags */}
                      {summary.tags && summary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {summary.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {summary.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{summary.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(summary.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
