import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { Sparkles, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface BountyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  suggestedReward: number;
  suggestedTokenType: string;
  tags: string[];
  contentType: string;
  platform: string;
  requirements: string[];
  deliverables: string[];
  exampleUrls: string[];
  usageCount: number;
}

interface TemplateLibraryProps {
  onUseTemplate: (template: BountyTemplate) => void;
}

export function TemplateLibrary({ onUseTemplate }: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading } = useQuery<{ templates: BountyTemplate[] }>({
    queryKey: ['/api/bounty-templates', selectedCategory],
    enabled: true,
  });

  const templates = data?.templates || [];

  const categories = ['all', 'DeFi', 'NFT', 'Layer2', 'Gaming', 'Infrastructure'];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-gain/10 text-gain border-gain/30';
      case 'medium': return 'bg-warn/10 text-warn border-warn/30';
      case 'hard': return 'bg-warn/10 text-warn border-warn/30';
      case 'expert': return 'bg-loss/10 text-loss border-loss/30';
      default: return 'bg-ink-raised text-secondary border-ink-edge';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-accent-core"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle as="h1" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent-bright" />
            Bounty Templates
          </SectionTitle>
          <p className="text-secondary mt-1">Choose a template to create your bounty faster</p>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="bg-ink-surface border border-ink-edge rounded-xl p-1">
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="rounded-xl text-secondary data-[state=active]:bg-accent-core data-[state=active]:text-primary data-[state=active]:glow-accent"
              data-testid={`tab-${category}`}
            >
              {category === 'all' ? 'All Templates' : category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Surface
                key={template.id}
                className="overflow-hidden transition-colors duration-300 hover:bg-ink-raised"
                data-testid={`template-${template.id}`}
              >
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <TrendingUp className="h-3 w-3 text-gain" />
                      <span className="tabular">{template.usageCount}</span> uses
                    </div>
                  </div>
                  <h3 className="font-display text-lg text-primary">{template.name}</h3>
                  <p className="text-secondary text-sm mt-1">
                    {template.description}
                  </p>
                </div>

                <div className="p-5 pt-2 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-body">
                    <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                      {template.category}
                    </Badge>
                    <span className="text-muted">•</span>
                    <span className="text-body">{template.contentType}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-accent-bright" />
                      <span className="text-body">Suggested Reward:</span>
                      <span className="font-semibold text-primary tabular">
                        {template.suggestedReward} {template.suggestedTokenType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider">Requirements</div>
                    <div className="space-y-1">
                      {template.requirements?.slice(0, 3).map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-body">
                          <CheckCircle2 className="h-4 w-4 text-gain mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                      {template.requirements?.length > 3 && (
                        <div className="text-xs text-muted">
                          +{template.requirements.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {template.tags?.slice(0, 3).map((tag) => (
                     <Badge key={tag} variant="secondary" className="text-xs bg-ink-raised text-secondary border border-ink-edge">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => onUseTemplate(template)}
                    className="w-full rounded-xl grad-accent text-primary hover:bg-accent-deep glow-accent"
                    data-testid={`button-use-template-${template.id}`}
                  >
                    Use Template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Surface>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-secondary">No templates found in this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
