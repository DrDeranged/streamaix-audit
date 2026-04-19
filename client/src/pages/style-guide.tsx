import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/PageHeader";
import { Brain, RefreshCw, Plus, Trophy } from "lucide-react";

const swatches = [
  { name: "Neon Purple", token: "neon-purple", value: "hsl(258, 84%, 62%)" },
  { name: "Neon Cyan", token: "neon-cyan", value: "hsl(195, 95%, 55%)" },
  { name: "Neon Fuchsia", token: "neon-fuchsia", value: "hsl(320, 88%, 60%)" },
  { name: "Neon Amber", token: "neon-amber", value: "hsl(43, 95%, 58%)" },
  { name: "Neon Emerald", token: "neon-emerald", value: "hsl(160, 80%, 45%)" },
  { name: "Neon Rose", token: "neon-rose", value: "hsl(0, 84%, 62%)" },
];

export default function StyleGuide() {
  const [progress, setProgress] = useState(62);
  const [slider, setSlider] = useState([55]);
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="section-container section-stack">
        <header className="space-y-3 pt-4">
          <div className="text-overline">StreamAiX · Design system</div>
          <h1 className="text-display text-3xl md:text-5xl text-white">
            Visual style reference
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            The canonical primitives, tokens, and surfaces used across the app.
            Build new screens by composing from this page so the system stays
            coherent.
          </p>
        </header>

        {/* Page header primitive */}
        <section className="space-y-3">
          <div className="text-overline">Page header · canonical primitive</div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every internal page renders its title through <code>&lt;PageHeader&gt;</code> so
            spacing, gradient title treatment, and mobile sizing stay consistent.
            Slots: eyebrow, icon, title, subtitle, actions, optional metric chips.
          </p>

          <div className="surface-1 rounded-xl p-5">
            <PageHeader
              eyebrow="AI · Reasoning chain"
              title="Smart Insights"
              icon={<Brain className="h-5 w-5" />}
              subtitle="Reasoning-chain market intelligence — regime shifts, divergences, contrarian setups, and if-then sequences."
              actions={
                <>
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="gradient-glow" size="sm" className="min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </>
              }
            />
          </div>

          <div className="surface-1 rounded-xl p-5">
            <PageHeader
              eyebrow="Earn · open bounties"
              title="Bounty Board"
              icon={<Trophy className="h-5 w-5" />}
              subtitle="Title-only variant with metric chips below — useful for hub pages."
              metrics={[
                { label: "Active", value: "128", tone: "purple" },
                { label: "Pool", value: "$48.2K", tone: "emerald" },
                { label: "Won this week", value: "23", tone: "cyan" },
                { label: "Avg payout", value: "$420", tone: "amber" },
              ]}
            />
          </div>

          <div className="surface-1 rounded-xl p-5">
            <PageHeader
              align="center"
              eyebrow="Centered variant"
              title="Marketing-style header"
              subtitle="Use sparingly — for landing-style hubs that benefit from a centered title."
            />
          </div>
        </section>

        {/* Color palette */}
        <section className="space-y-3">
          <div className="text-overline">Color · Neon palette</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {swatches.map((s) => (
              <div key={s.token} className="surface-1 rounded-lg p-3 space-y-2">
                <div
                  className="h-14 rounded-md"
                  style={{ backgroundColor: s.value }}
                  data-testid={`swatch-${s.token}`}
                />
                <div className="text-sm font-semibold text-white">{s.name}</div>
                <div className="text-[11px] text-muted-foreground numeric">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-3">
          <div className="text-overline">Typography</div>
          <div className="surface-1 rounded-lg p-6 space-y-4">
            <div className="text-overline">Overline · 11/12 · Inter 600</div>
            <h1 className="text-display text-5xl text-white">
              Display · Orbitron 700
            </h1>
            <h2 className="text-3xl font-bold text-white">Heading 2 · Inter 700</h2>
            <h3 className="text-xl font-semibold text-white">Heading 3 · Inter 600</h3>
            <p className="text-base text-foreground/90">
              Body · Inter 400 — used for paragraphs and descriptions.
            </p>
            <p className="text-sm text-muted-foreground">
              Caption · Inter 400 — used for metadata and helper text.
            </p>
            <p className="text-2xl font-semibold text-white numeric">
              1,284,330.55 · numeric (tabular)
            </p>
          </div>
        </section>

        {/* Surfaces */}
        <section className="space-y-3">
          <div className="text-overline">Surfaces · Three glass elevations</div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="surface-1 rounded-lg p-5">
              <div className="text-overline mb-2">surface-1</div>
              <div className="text-sm text-muted-foreground">
                Resting tier. Use for stat cards, list rows, secondary panels.
              </div>
            </div>
            <div className="surface-2 surface-interactive rounded-lg p-5">
              <div className="text-overline mb-2">surface-2 · interactive</div>
              <div className="text-sm text-muted-foreground">
                Default tier. Hover lifts and brightens the border.
              </div>
            </div>
            <div className="surface-3 rounded-lg p-5">
              <div className="text-overline mb-2">surface-3</div>
              <div className="text-sm text-muted-foreground">
                Elevated tier. Use for modals, focused content, hero cards.
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-3">
          <div className="text-overline">Buttons</div>
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button variant="gradient-glow" data-testid="btn-gradient-glow">
                Gradient Glow
              </Button>
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg" variant="gradient-glow">Large CTA</Button>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-3">
          <div className="text-overline">Cards · Default Card primitive</div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Backed by <code>--card</code>, rounded, blurred, with a hover
                  glow.
                </p>
              </CardContent>
            </Card>
            <Card className="border-neon-purple/40">
              <CardHeader>
                <CardTitle className="text-neon-purple">Purple-accented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add an accent border to encode meaning without rebuilding the
                  card.
                </p>
              </CardContent>
            </Card>
            <Card className="border-neon-emerald/40">
              <CardHeader>
                <CardTitle className="text-neon-emerald">Success-accented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Same primitive — the accent comes from one extra utility
                  class.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-3">
          <div className="text-overline">Badges</div>
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-6">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="gradient">Gradient</Badge>
            </CardContent>
          </Card>
        </section>

        {/* Progress + Slider + Switch */}
        <section className="space-y-3">
          <div className="text-overline">Inputs · Progress, slider, switch</div>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="numeric text-white">{progress}%</span>
                </div>
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setProgress(Math.max(0, progress - 10))}>−10</Button>
                  <Button size="sm" variant="ghost" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Slider</span>
                  <span className="numeric text-white">{slider[0]}</span>
                </div>
                <Slider value={slider} onValueChange={setSlider} max={100} step={1} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Switch</span>
                <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabs + Tooltip */}
        <section className="space-y-3">
          <div className="text-overline">Tabs &amp; tooltip</div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="trades">Trades</TabsTrigger>
                  <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <p className="text-sm text-muted-foreground pt-3">
                    Active tab uses a gradient tint plus a cyan underline glow.
                  </p>
                </TabsContent>
                <TabsContent value="trades">
                  <p className="text-sm text-muted-foreground pt-3">
                    Tab content panel.
                  </p>
                </TabsContent>
                <TabsContent value="reasoning">
                  <p className="text-sm text-muted-foreground pt-3">
                    Tab content panel.
                  </p>
                </TabsContent>
              </Tabs>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>Branded tooltip with purple ring</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Numeric tables */}
        <section className="space-y-3 pb-12">
          <div className="text-overline">Numeric · tabular alignment</div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="text-overline">Avatar PnL · numeric</div>
                {[
                  { name: "Anatoly", value: 29297.55, pnl: 4129.23 },
                  { name: "Vitalik", value: 24112.0, pnl: -892.41 },
                  { name: "Sam", value: 19874.6, pnl: 1203.0 },
                ].map((r) => (
                  <div key={r.name} className="grid grid-cols-3 gap-2">
                    <div className="text-white">{r.name}</div>
                    <div className="text-right numeric text-white">
                      ${r.value.toLocaleString()}
                    </div>
                    <div
                      className={`text-right numeric ${r.pnl >= 0 ? "text-neon-emerald" : "text-neon-rose"}`}
                    >
                      {r.pnl >= 0 ? "+" : ""}${r.pnl.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
