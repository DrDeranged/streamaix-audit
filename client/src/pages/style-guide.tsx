import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/PageHeader";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
import LedgerRow from "@/components/ds/LedgerRow";
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
    <div className="min-h-[100dvh] bg-ink-page text-body">
      <div className="section-container section-stack">
        <header className="space-y-3 pt-4">
          <div className="text-overline">StreamAiX · Design system</div>
          <h1 className="font-display text-3xl md:text-5xl text-primary">
            Visual style reference
          </h1>
          <p className="text-secondary max-w-2xl">
            The canonical primitives, tokens, and surfaces used across the app.
            Build new screens by composing from this page so the system stays
            coherent.
          </p>
        </header>

        {/* Page header primitive */}
        <section className="space-y-3">
          <SectionTitle eyebrow="Page header · canonical primitive">Canonical page header</SectionTitle>
          <p className="text-sm text-secondary max-w-2xl">
            Every internal page renders its title through <code>&lt;PageHeader&gt;</code> so
            spacing, gradient title treatment, and mobile sizing stay consistent.
            Slots: eyebrow, icon, title, subtitle, actions, optional metric chips.
          </p>

          <Surface className="p-5">
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
                  <Button variant="gradient-glow" size="sm" className="min-h-[44px] grad-accent glow-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </>
              }
            />
          </Surface>

          <Surface className="p-5">
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
          </Surface>

          <Surface className="p-5">
            <PageHeader
              align="center"
              eyebrow="Centered variant"
              title="Marketing-style header"
              subtitle="Use sparingly — for landing-style hubs that benefit from a centered title."
            />
          </Surface>
        </section>

        {/* Color palette */}
        <section className="space-y-3">
          <SectionTitle eyebrow="Color">StreamAiX accent palette</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {swatches.map((s) => (
              <Surface key={s.token} variant="raised" className="p-3 space-y-2">
                <div
                  className="h-14 rounded-xl"
                  style={{ backgroundColor: s.value }}
                  data-testid={`swatch-${s.token}`}
                />
                <div className="text-sm font-semibold text-primary">{s.name}</div>
                <div className="text-[11px] text-secondary tabular">
                  {s.value}
                </div>
              </Surface>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-3">
          <SectionTitle>Typography</SectionTitle>
          <Surface className="p-6 space-y-4">
            <div className="text-overline">Overline · 11/12 · Inter 600</div>
            <h1 className="font-display text-5xl text-primary">
              Display · Orbitron 700
            </h1>
            <h2 className="text-3xl font-bold text-primary">Heading 2 · Inter 700</h2>
            <h3 className="text-xl font-semibold text-primary">Heading 3 · Inter 600</h3>
            <p className="text-base text-body">
              Body · Inter 400 — used for paragraphs and descriptions.
            </p>
            <p className="text-sm text-secondary">
              Caption · Inter 400 — used for metadata and helper text.
            </p>
            <p className="text-2xl font-semibold text-primary tabular">
              1,284,330.55 · numeric (tabular)
            </p>
          </Surface>
        </section>

        {/* Surfaces */}
        <section className="space-y-3">
          <SectionTitle>Surfaces · Three ink elevations</SectionTitle>
          <div className="grid md:grid-cols-3 gap-4">
            <Surface className="p-5">
              <div className="text-overline mb-2">ink-surface</div>
              <div className="text-sm text-secondary">
                Resting tier. Use for stat cards, list rows, secondary panels.
              </div>
            </Surface>
            <Surface variant="raised" className="p-5">
              <div className="text-overline mb-2">ink-raised · interactive</div>
              <div className="text-sm text-secondary">
                Default tier. Hover lifts and brightens the border.
              </div>
            </Surface>
            <Surface variant="raised" className="p-5">
              <div className="text-overline mb-2">ink-raised · elevated</div>
              <div className="text-sm text-secondary">
                Elevated tier. Use for modals, focused content, hero cards.
              </div>
            </Surface>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-3">
          <SectionTitle>Buttons</SectionTitle>
          <Surface>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button variant="gradient-glow" className="grad-accent glow-accent" data-testid="btn-gradient-glow">
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
          </Surface>
        </section>

        {/* Cards */}
        <section className="space-y-3">
          <SectionTitle>Cards · Default surface primitive</SectionTitle>
          <div className="grid md:grid-cols-3 gap-4">
            <Surface>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary">
                  Backed by <code>--card</code>, rounded, blurred, with a hover
                  glow.
                </p>
              </CardContent>
            </Surface>
            <Surface className="border-accent-core/40">
              <CardHeader>
                  <CardTitle className="text-accent-bright">Violet-accented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary">
                  Add an accent border to encode meaning without rebuilding the
                  card.
                </p>
              </CardContent>
            </Surface>
            <Surface className="border-gain/40">
              <CardHeader>
                  <CardTitle className="text-gain">Success-accented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary">
                  Same primitive — the accent comes from one extra utility
                  class.
                </p>
              </CardContent>
            </Surface>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-3">
          <SectionTitle>Badges</SectionTitle>
          <Surface>
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
          </Surface>
        </section>

        {/* Progress + Slider + Switch */}
        <section className="space-y-3">
          <SectionTitle>Inputs · Progress, slider, switch</SectionTitle>
          <Surface>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Progress</span>
                  <span className="tabular text-primary">{progress}%</span>
                </div>
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setProgress(Math.max(0, progress - 10))}>−10</Button>
                  <Button size="sm" variant="ghost" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Slider</span>
                  <span className="tabular text-primary">{slider[0]}</span>
                </div>
                <Slider value={slider} onValueChange={setSlider} max={100} step={1} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Switch</span>
                <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              </div>
            </CardContent>
          </Surface>
        </section>

        {/* Tabs + Tooltip */}
        <section className="space-y-3">
          <SectionTitle>Tabs &amp; tooltip</SectionTitle>
          <Surface>
            <CardContent className="pt-6 space-y-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="trades">Trades</TabsTrigger>
                  <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <p className="text-sm text-secondary pt-3">
                    Active tab uses a gradient tint plus a cyan underline glow.
                  </p>
                </TabsContent>
                <TabsContent value="trades">
                    <p className="text-sm text-secondary pt-3">
                    Tab content panel.
                  </p>
                </TabsContent>
                <TabsContent value="reasoning">
                    <p className="text-sm text-secondary pt-3">
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
          </Surface>
        </section>

        {/* Numeric tables */}
        <section className="space-y-3 pb-12">
          <SectionTitle>Numeric · tabular alignment</SectionTitle>
          <Surface>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="text-overline">Avatar PnL · tabular</div>
                {[
                  { name: "Anatoly", value: 29297.55, pnl: 4129.23 },
                  { name: "Vitalik", value: 24112.0, pnl: -892.41 },
                  { name: "Sam", value: 19874.6, pnl: 1203.0 },
                ].map((r) => (
                  <LedgerRow
                    key={r.name}
                    label={r.name}
                    value={`$${r.value.toLocaleString()}`}
                    delta={r.pnl}
                    deltaSuffix=""
                  />
                ))}
              </div>
            </CardContent>
          </Surface>
        </section>
      </div>
    </div>
  );
}
