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
          className="gap-2 bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50 text-slate-300"
          data-testid="widget-settings-trigger"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] bg-slate-950 border-slate-800 p-0"
      >
        <SheetHeader className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Widget Settings
            </SheetTitle>
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
              {visibleCount}/{totalCount} visible
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
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
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn(
                            "w-4 h-4 text-slate-500 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                          <span className="text-sm font-medium text-white">{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs px-1.5",
                              allVisible && "border-emerald-500/50 text-emerald-400",
                              noneVisible && "border-red-500/50 text-red-400",
                              !allVisible && !noneVisible && "border-amber-500/50 text-amber-400"
                            )}
                          >
                            {visibleInCategory}/{categoryWidgets.length}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategory(category.id, !allVisible);
                            }}
                            className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                            title={allVisible ? 'Hide all' : 'Show all'}
                          >
                            {allVisible ? (
                              <Eye className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-slate-800 divide-y divide-slate-800/50">
                        {categoryWidgets.map((widget, index) => (
                          <div 
                            key={widget.id}
                            className="flex items-center justify-between p-2 pl-8 hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Switch
                                checked={widget.visible}
                                onCheckedChange={() => toggleVisibility(widget.id)}
                                className="data-[state=checked]:bg-cyan-500"
                                data-testid={`toggle-${widget.id}`}
                              />
                              <span className={cn(
                                "text-sm transition-colors",
                                widget.visible ? "text-slate-200" : "text-slate-500"
                              )}>
                                {widget.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => moveUp(widget.id)}
                                disabled={index === 0}
                                className={cn(
                                  "p-1 rounded transition-colors",
                                  index === 0 
                                    ? "text-slate-700 cursor-not-allowed" 
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
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
                                  "p-1 rounded transition-colors",
                                  index === categoryWidgets.length - 1 
                                    ? "text-slate-700 cursor-not-allowed" 
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
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
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="w-full gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
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
