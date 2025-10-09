import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'expert': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Bounty Templates
          </h2>
          <p className="text-gray-400 mt-1">Choose a template to create your bounty faster</p>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              data-testid={`tab-${category}`}
            >
              {category === 'all' ? 'All Templates' : category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                data-testid={`template-${template.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendingUp className="h-3 w-3" />
                      {template.usageCount} uses
                    </div>
                  </div>
                  <CardTitle className="text-white">{template.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Badge variant="outline" className="border-purple-400/30 text-purple-300">
                      {template.category}
                    </Badge>
                    <span className="text-gray-500">•</span>
                    <span>{template.contentType}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Suggested Reward:</span>
                      <span className="font-semibold text-white">
                        {template.suggestedReward} {template.suggestedTokenType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase">Requirements</div>
                    <div className="space-y-1">
                      {template.requirements?.slice(0, 3).map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                      {template.requirements?.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{template.requirements.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {template.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => onUseTemplate(template)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    data-testid={`button-use-template-${template.id}`}
                  >
                    Use Template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No templates found in this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
