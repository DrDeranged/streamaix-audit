import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  LayoutGrid
} from 'lucide-react';
import { useWidgetSettings, WIDGET_CATEGORIES } from '@/contexts/WidgetSettingsContext';
import { cn } from '@/lib/utils';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

export function WidgetSettingsPanel() {
  const { 
    getWidgetsByCategory, 
    toggleVisibility, 
    moveUp, 
    moveDown, 
    resetToDefaults,
    toggleCategory,
    widgets
  } = useWidgetSettings();
  
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['market-overview']));
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategoryOpen = (categoryId: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const visibleCount = widgets.filter(w => w.visible).length;
  const totalCount = widgets.length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 rounded-xl bg-ink-surface border-ink-edge hover:bg-ink-raised hover:border-accent-core/50 text-body"
          data-testid="widget-settings-trigger"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] rounded-2xl bg-ink-page border-ink-edge p-0"
      >
        <SheetHeader className="p-4 border-b border-ink-divider">
          <div className="flex items-center justify-between">
            <SheetTitle asChild>
              <SectionTitle as="h2" className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent-bright" />
                Widget Settings
              </SectionTitle>
            </SheetTitle>
            <Badge variant="outline" className="rounded-xl text-xs border-ink-edge text-secondary">
              {visibleCount}/{totalCount} visible
            </Badge>
          </div>
          <p className="text-xs text-muted mt-1">
            Show, hide, or reorder dashboard widgets
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 space-y-2">
            {WIDGET_CATEGORIES.map(category => {
              const categoryWidgets = getWidgetsByCategory(category.id);
              const visibleInCategory = categoryWidgets.filter(w => w.visible).length;
              const isExpanded = openCategories.has(category.id);
              const allVisible = visibleInCategory === categoryWidgets.length;
              const noneVisible = visibleInCategory === 0;

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleCategoryOpen(category.id)}
                >
                  <Surface variant="raised" className="overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-ink-raised transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn(
                            "w-4 h-4 text-muted transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                          <span className="text-sm font-medium text-primary">{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                               "rounded-xl text-xs px-1.5",
                               allVisible && "border-gain/50 text-gain",
                               noneVisible && "border-loss/50 text-loss",
                               !allVisible && !noneVisible && "border-warn/50 text-warn"
                            )}
                          >
                            {visibleInCategory}/{categoryWidgets.length}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategory(category.id, !allVisible);
                            }}
                             className="p-1 rounded-xl hover:bg-ink-raised transition-colors"
                            title={allVisible ? 'Hide all' : 'Show all'}
                          >
                            {allVisible ? (
                               <Eye className="w-4 h-4 text-gain" />
                            ) : (
                               <EyeOff className="w-4 h-4 text-muted" />
                            )}
                          </button>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                       <div className="border-t border-ink-divider divide-y divide-ink-divider">
                        {categoryWidgets.map((widget, index) => (
                          <div 
                            key={widget.id}
                             className="flex items-center justify-between p-2 pl-8 hover:bg-ink-raised transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Switch
                                checked={widget.visible}
                                onCheckedChange={() => toggleVisibility(widget.id)}
                                 className="data-[state=checked]:bg-accent-core"
                                data-testid={`toggle-${widget.id}`}
                              />
                              <span className={cn(
                                 "text-sm transition-colors",
                                 widget.visible ? "text-body" : "text-muted"
                              )}>
                                {widget.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => moveUp(widget.id)}
                                disabled={index === 0}
                                className={cn(
                                   "p-1 rounded-xl transition-colors",
                                  index === 0 
                                     ? "text-muted cursor-not-allowed"
                                     : "text-secondary hover:text-primary hover:bg-ink-raised"
                                )}
                                title="Move up"
                                data-testid={`moveup-${widget.id}`}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveDown(widget.id)}
                                disabled={index === categoryWidgets.length - 1}
                                className={cn(
                                   "p-1 rounded-xl transition-colors",
                                  index === categoryWidgets.length - 1 
                                     ? "text-muted cursor-not-allowed"
                                     : "text-secondary hover:text-primary hover:bg-ink-raised"
                                )}
                                title="Move down"
                                data-testid={`movedown-${widget.id}`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Surface>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ink-divider bg-ink-page">
          <Button
            variant="outline"
            onClick={resetToDefaults}
             className="w-full gap-2 rounded-xl border-ink-edge text-body hover:bg-ink-raised hover:text-primary"
            data-testid="reset-widgets"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
