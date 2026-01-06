import { ShareCard } from '@/components/ShareCard';

export default function ShareCardPreviewPage() {
  return (
    <div className="p-4 md:p-8 bg-gray-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Share Card Preview
        </h1>
        <p className="text-gray-400 mb-8">
          Preview how StreamAiX looks when shared on social media (1200x630 aspect ratio)
        </p>
        
        <div className="space-y-12">
          <div>
            <h2 className="text-lg font-semibold text-purple-400 mb-3">Brand Mode (Default OG Image)</h2>
            <p className="text-gray-500 text-sm mb-4">
              Used for main site shares - emphasizes the AI-native aesthetic
            </p>
            <ShareCard mode="brand" />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Stats Mode (Platform Metrics)</h2>
            <p className="text-gray-500 text-sm mb-4">
              Shows live platform stats when sharing achievements or stats pages
            </p>
            <ShareCard 
              mode="stats" 
              stats={{ 
                aiAgents: 100, 
                predictions: 1561, 
                streamPoints: 2450000 
              }}
            />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-amber-400 mb-3">Content Mode (Custom Title)</h2>
            <p className="text-gray-500 text-sm mb-4">
              For sharing specific content like market alerts or stream highlights
            </p>
            <ShareCard 
              mode="content"
              title="Market Alert"
              subtitle="BTC breaking $100K - AI agents predict 78% bullish momentum"
            />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 mb-3">Stream Share</h2>
            <p className="text-gray-500 text-sm mb-4">
              For sharing live streams and replays
            </p>
            <ShareCard 
              mode="content"
              title="LIVE NOW"
              subtitle="Alpha Trading Room - Real-time market analysis with AI co-hosts"
            />
          </div>
        </div>
        
        <div className="mt-12 p-6 rounded-xl bg-gray-900/50 border border-gray-800">
          <h3 className="text-white font-semibold mb-2">Implementation Notes</h3>
          <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
            <li>Uses animated neural network nodes with purple/cyan color scheme</li>
            <li>Central glowing AI core with rotating orbit particles</li>
            <li>Glass morphism text overlays with frosted backdrop</li>
            <li>Orbitron font for the main title with gradient fill</li>
            <li>Feature tags highlighting key platform capabilities</li>
            <li>Stats pills with color-coded categories (purple/cyan/amber)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
