import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/landing/navigation";
import { PageHeader } from "@/components/PageHeader";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      case 'completed': return 'bg-gain/15 text-gain border-gain/30';
      case 'processing': return 'bg-warn/15 text-warn border-warn/30';
      case 'failed': return 'bg-loss/15 text-loss border-loss/30';
      default: return 'bg-ink-raised text-secondary border-ink-edge';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-ink-page">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <PageHeader
          align="center"
          eyebrow="AI-processed content"
          title="Content Summaries"
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="Browse all AI-processed videos, podcasts, and livestreams transformed into actionable insights."
          className="mb-12"
        />

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search summaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                 className="rounded-xl border-ink-edge bg-ink-surface pl-10 text-body placeholder:text-muted focus-visible:ring-accent-core"
                data-testid="input-search-summaries"
              />
            </div>

            {/* Content Type Filter */}
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
               <SelectTrigger className="w-full rounded-xl border-ink-edge bg-ink-surface text-body sm:w-48" data-testid="select-content-type">
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
               <SelectTrigger className="w-full rounded-xl border-ink-edge bg-ink-surface text-body sm:w-48" data-testid="select-status">
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
             <p className="text-sm text-secondary">
              Showing {filteredSummaries.length} of {(summaries as any[]).length} summaries
            </p>
            <Link href="/create-summary">
               <Button variant="outline" className="rounded-xl border-ink-edge bg-ink-surface text-body hover:bg-ink-raised hover:text-primary gap-2" data-testid="button-create-new">
                <Sparkles className="w-4 h-4" />
                Create New
              </Button>
            </Link>
          </div>
        </div>

        {/* Summaries Grid */}
        {isLoading ? (
           <div className="text-center py-12 text-secondary">
            <div className="animate-pulse">Loading summaries...</div>
          </div>
        ) : filteredSummaries.length === 0 ? (
           <div className="text-center py-12">
             <FileText className="mx-auto mb-4 h-16 w-16 text-muted" />
             <SectionTitle as="h3" className="mb-2 text-xl font-semibold">
              {searchTerm || contentTypeFilter !== "all" || statusFilter !== "all" 
                ? "No summaries match your filters" 
                : "No summaries yet"}
             </SectionTitle>
             <p className="mb-6 text-secondary">
              {searchTerm || contentTypeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first AI-processed summary"}
            </p>
            {!searchTerm && contentTypeFilter === "all" && statusFilter === "all" && (
             <Link href="/create-summary">
                 <Button className="rounded-xl bg-accent-core text-primary hover:bg-accent-deep glow-accent" data-testid="button-create-first">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create First Summary
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSummaries.map((summary: any) => (
              <Surface 
                key={summary.id} 
                className="group cursor-pointer transition-transform hover:scale-[1.02]"
                data-testid={`card-summary-${summary.id}`}
              >
                <Link href={`/summary/${summary.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                         className="border-accent-core/30 bg-accent-core/15 text-accent-bright"
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
                     <CardTitle className="line-clamp-2 text-lg text-primary transition-colors group-hover:text-accent-bright">
                      {summary.title}
                    </CardTitle>
                     <CardDescription className="line-clamp-3 text-secondary">
                      {summary.description || summary.tldrSummary || summary.executiveSummary || 'AI-processed content'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Tags */}
                      {summary.tags && summary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {summary.tags.slice(0, 3).map((tag: string) => (
                           <Badge key={tag} variant="secondary" className="rounded-xl border-ink-edge bg-ink-raised text-xs text-secondary">
                              {tag}
                            </Badge>
                          ))}
                          {summary.tags.length > 3 && (
                             <Badge variant="secondary" className="rounded-xl border-ink-edge bg-ink-raised text-xs text-secondary">
                              +{summary.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                       <div className="flex items-center justify-between border-t border-ink-divider pt-2">
                         <div className="flex items-center gap-2 text-sm text-secondary">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(summary.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                         <ArrowRight className="h-4 w-4 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent-bright" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Surface>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
