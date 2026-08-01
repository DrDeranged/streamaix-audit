import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Navigation } from '@/components/ui/navigation';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { 
  Image, 
  ExternalLink, 
  Share, 
  Download,
  Eye,
  Zap,
  Globe,
  Calendar,
  Hash,
  Copy,
  Award,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    summary?: string;
    keyInsights?: string[];
    chapters?: Array<{title: string, content: string, timestamp: string}>;
    metadata?: any;
  };
}

export default function NFTGallery() {
  const { isAuthenticated } = useAuth();
  const { isConnected, formatAddress } = useWeb3();
  const { userNFTs, isLoading, mintSummaryNFT } = useContracts();
  
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Mock additional NFT data for demonstration
  const [featuredNFTs] = useState([
    {
      tokenId: 'demo_1',
      name: 'Web3 Revolution Explained',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=web3revolution&backgroundColor=6366f1,8b5cf6,a855f7&scale=80',
      creator: '0x742d35Cc...C2D7',
      price: '2.5 ETH',
      rarity: 'Epic',
      views: 1247,
      platform: 'YouTube',
    },
    {
      tokenId: 'demo_2',
      name: 'DeFi Protocols Deep Dive',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=defiprotocols&backgroundColor=8b5cf6,a855f7,ec4899&scale=80',
      creator: '0x891b23C...F8E2',
      price: '1.8 ETH',
      rarity: 'Rare',
      views: 892,
      platform: 'Podcast',
    },
    {
      tokenId: 'demo_3',
      name: 'NFT Market Analysis 2024',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=nftmarket2024&backgroundColor=a855f7,ec4899,f97316&scale=80',
      creator: '0x234c89D...A7B4',
      price: '3.2 ETH',
      rarity: 'Legendary',
      views: 2156,
      platform: 'Twitter',
    },
  ]);

  const handleMintDemo = async () => {
    setIsMinting(true);
    try {
      const demoSummary = {
        title: 'Demo AI Summary NFT',
        content: 'This is a demonstration of our AI-powered summary minting system. In a real scenario, this would contain a comprehensive analysis of video or audio content.',
        originalUrl: 'https://example.com/demo-content',
        keyInsights: [
          'AI-generated summaries provide instant value',
          'NFTs enable content ownership and monetization',
          'Decentralized storage ensures permanence',
        ],
        chapters: [
          { title: 'Introduction', content: 'Overview of the topic', timestamp: '00:00' },
          { title: 'Main Content', content: 'Core discussion points', timestamp: '05:30' },
          { title: 'Conclusion', content: 'Key takeaways', timestamp: '12:45' },
        ],
        metadata: {
          processingTime: '45 seconds',
          accuracy: 94,
          language: 'English',
        },
      };

      await mintSummaryNFT(demoSummary);
    } catch (error) {
      console.error('Demo minting failed:', error);
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-warn/15 text-warn border-warn/30';
      case 'Epic': return 'bg-accent-core/15 text-accent-bright border-accent-core/30';
      case 'Rare': return 'bg-accent-core/10 text-accent-bright border-accent-core/25';
      case 'Common': return 'bg-ink-raised text-secondary border-ink-edge';
      default: return 'bg-ink-raised text-secondary border-ink-edge';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink-page">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Surface className="rounded-xl">
            <div className="p-8 text-center">
              <Image className="h-16 w-16 text-accent-bright mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary mb-2">Authentication Required</h2>
              <p className="text-body mb-6">Please sign in to view and manage your NFT collection.</p>
              <Button className="grad-accent glow-accent rounded-xl">
                Sign In
              </Button>
            </div>
          </Surface>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-page">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="On-chain · summary NFTs"
            title="NFT Gallery"
            icon={<Sparkles className="h-5 w-5" />}
            subtitle="Your AI-generated summary NFTs and marketplace."
            actions={
              <Button
                onClick={handleMintDemo}
                disabled={isMinting || !isConnected}
                className="min-h-[44px] rounded-xl grad-accent glow-accent"
              >
                {isMinting ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Mint Demo NFT
                  </>
                )}
              </Button>
            }
          />
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Surface className="p-0">
            <div className="p-4 pb-2">
              <div className="text-primary text-sm font-medium">Your NFTs</div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <StatValue label="" value={userNFTs.length} />
                  <p className="text-secondary text-sm">Owned</p>
                </div>
                <Award className="h-8 w-8 text-accent-bright" />
              </div>
            </div>
          </Surface>

          <Surface className="p-0">
            <div className="p-4 pb-2">
              <div className="text-primary text-sm font-medium">Total Collection</div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <StatValue label="" value="1,247" />
                  <p className="text-gain text-sm tabular">+15 today</p>
                </div>
                <Image className="h-8 w-8 text-gain" />
              </div>
            </div>
          </Surface>

          <Surface className="p-0">
            <div className="p-4 pb-2">
              <div className="text-primary text-sm font-medium">Floor Price</div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <StatValue label="" value="0.15 ETH" />
                  <p className="text-accent-bright text-sm tabular">~$387</p>
                </div>
                <Globe className="h-8 w-8 text-accent-bright" />
              </div>
            </div>
          </Surface>

          <Surface className="p-0">
            <div className="p-4 pb-2">
              <div className="text-primary text-sm font-medium">Volume (24h)</div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <StatValue label="" value="45.8 ETH" />
                  <p className="text-warn text-sm tabular">142 sales</p>
                </div>
                <Zap className="h-8 w-8 text-warn" />
              </div>
            </div>
          </Surface>
        </motion.div>

        {/* Your NFTs Section */}
        {userNFTs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <SectionTitle className="mb-4">Your Collection</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNFTs.map((nft, index) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Surface className="group overflow-hidden transition-all duration-300 hover:bg-ink-raised">
                    <div className="p-0">
                      <div className="aspect-square bg-ink-raised flex items-center justify-center">
                        {nft.metadata?.image ? (
                          <img
                            src={nft.metadata.image}
                            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <Image className="h-16 w-16 text-muted" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-primary font-semibold truncate">
                            {nft.metadata?.name || `Summary NFT #${nft.tokenId}`}
                          </h3>
                          <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                            #{nft.tokenId}
                          </Badge>
                        </div>
                        <p className="text-secondary text-sm mb-4 line-clamp-2">
                          {nft.metadata?.description || 'AI-generated content summary'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(nft.ipfsHash)}
                              className="h-8 w-8 p-0 hover:bg-ink-raised"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`, '_blank')}
                              className="h-8 w-8 p-0 hover:bg-ink-raised"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="rounded-xl grad-accent"
                                onClick={() => setSelectedNFT(nft)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-ink-surface border-ink-edge text-primary rounded-2xl max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {nft.metadata?.image && (
                                  <img
                                    src={nft.metadata.image}
                                    alt={nft.metadata.name}
                                    className="w-full h-64 object-cover rounded-xl"
                                  />
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-muted text-sm">Token ID</p>
                                    <p className="text-primary">{nft.tokenId}</p>
                                  </div>
                                  <div>
                                  <p className="text-muted text-sm">Storage</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">IPFS</Badge>
                                      <Badge variant="outline" className="text-xs">Arweave</Badge>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted text-sm mb-2">Description</p>
                                  <p className="text-primary">{nft.metadata?.description}</p>
                                </div>
                                {nft.metadata?.attributes && (
                                  <div>
                                    <p className="text-muted text-sm mb-2">Attributes</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {nft.metadata.attributes.map((attr: any, i: number) => (
                                        <div key={i} className="p-2 bg-ink-raised rounded-xl">
                                          <p className="text-muted text-xs">{attr.trait_type}</p>
                                          <p className="text-primary text-sm">{attr.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </Surface>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Featured NFTs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SectionTitle className="mb-4">Featured Collection</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Surface className="group overflow-hidden transition-all duration-300 hover:bg-ink-raised">
                  <div className="p-0">
                    <div className="aspect-square bg-ink-raised">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-primary font-semibold truncate">{nft.name}</h3>
                        <Badge className={getRarityColor(nft.rarity)}>
                          {nft.rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-secondary text-sm">
                          by {formatAddress(nft.creator)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {nft.platform}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-accent-bright font-semibold tabular">{nft.price}</p>
                          <p className="text-muted text-xs flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {nft.views} views
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-xl border-ink-edge text-primary hover:bg-ink-raised"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl grad-accent"
                        >
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {userNFTs.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-12"
          >
            <Surface className="max-w-md mx-auto">
              <div className="p-8">
                <Image className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No NFTs Yet</h3>
                <p className="text-secondary mb-6">
                  Create your first AI-generated summary NFT by processing content through our platform.
                </p>
                <Button
                  onClick={handleMintDemo}
                  disabled={isMinting || !isConnected}
                  className="rounded-xl grad-accent"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mint Your First NFT
                </Button>
              </div>
            </Surface>
          </motion.div>
        )}
      </div>
    </div>
  );
}