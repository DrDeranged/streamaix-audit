# Streaming Scalability Specification

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** LIVE (P2P WebRTC) | SFU PLANNED

---

## 1. Current Architecture: Pure P2P WebRTC

### Implementation
StreamAiX uses **peer-to-peer WebRTC** with **WebSocket signaling** for live video streaming.

```
[Broadcaster] ←→ [WebSocket Server] ←→ [Viewers]
      ↓                                    ↓
   [Camera]                          [Video Display]
      ↓                                    ↓
 [WebRTC Peer] ← ICE Candidates → [WebRTC Peer]
```

### Technology Stack
| Component | Technology | Status |
|-----------|------------|--------|
| Video/Audio | WebRTC MediaStream API | LIVE |
| Signaling | WebSocket (ws library) | LIVE |
| ICE Servers | STUN only | LIVE |
| Media Relay | TURN | NOT DEPLOYED |
| Media Routing | SFU | PLANNED |

---

## 2. Current Capacity Limits

### Recommended Max Viewers Per Stream: ~50

**Why 50?**
- P2P requires broadcaster to maintain separate connection per viewer
- Each connection consumes upstream bandwidth
- CPU/memory usage scales linearly with viewers
- Browser peer connection limits (typically 50-256 depending on browser)

### Capacity Breakdown
| Viewers | Broadcaster Load | Network Load | Quality |
|---------|-----------------|--------------|---------|
| 1-10 | Low | ~5-10 Mbps up | Excellent |
| 11-30 | Medium | ~15-30 Mbps up | Good |
| 31-50 | High | ~25-50 Mbps up | Acceptable |
| 51+ | Degraded | Bandwidth saturated | Poor |

---

## 3. STUN Servers

### Currently Used
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];
```

### STUN Limitations
- Only works when peers can establish direct connection
- Fails for ~15-20% of users behind symmetric NAT
- No relay capability

---

## 4. TURN Server Plan

### Status: NOT DEPLOYED

### Timeline: Q1 2026 (60 days)

### Cost Estimate
| Option | Monthly Cost | Notes |
|--------|--------------|-------|
| Twilio TURN | $50-100 | Pay-per-use, ~$0.40/GB |
| Self-hosted coturn | $20-50 | VPS + bandwidth |
| Cloudflare Calls | $0.10/min | Beta program |
| Xirsys | $50-100 | Enterprise-grade |

### Recommended: Twilio TURN
- Easy API integration
- Global edge network
- Pay-as-you-go pricing
- 99.99% uptime SLA

### TURN Integration Plan
1. Create Twilio account and get TURN credentials
2. Generate time-limited credentials per session
3. Add TURN URLs to ICE configuration
4. Test with symmetric NAT users
5. Monitor relay bandwidth usage

```javascript
// Future ICE configuration with TURN
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: 'GENERATED_USERNAME',
    credential: 'GENERATED_CREDENTIAL'
  },
  {
    urls: 'turn:global.turn.twilio.com:443?transport=tcp',
    username: 'GENERATED_USERNAME',
    credential: 'GENERATED_CREDENTIAL'
  }
];
```

---

## 5. SFU Migration Plan

### Status: PLANNED

### Timeline: Q2 2026 (120 days)

### Trigger Condition
When any stream exceeds 30 concurrent viewers, route through SFU instead of P2P.

### SFU Options Evaluated

| Option | Type | Pros | Cons |
|--------|------|------|------|
| **Mediasoup** | Self-hosted | Open source, full control | Complex setup |
| **Janus** | Self-hosted | Battle-tested, plugin system | Learning curve |
| **LiveKit** | Managed | Easy API, auto-scaling | Higher cost |
| **Daily.co** | Managed | Simple integration | Vendor lock-in |

### Recommended: LiveKit (Managed)
- WebSocket-based signaling (same as current)
- Built-in recording and replays
- Auto-scaling across regions
- React SDK available
- ~$0.01/minute/viewer

### Migration Strategy
```
Phase 1: P2P for <30 viewers (CURRENT)
         ↓
Phase 2: Hybrid - P2P default, SFU spillover at 30+ viewers
         ↓
Phase 3: SFU-first for all streams
```

---

## 6. Failover Behavior

### Current Failover: Chat + Overlays

When WebRTC connection fails:
1. Video stream stops
2. Chat remains functional (WebSocket)
3. Market overlays remain visible
4. Viewer count updates continue
5. User sees "Reconnecting..." message

### Connection State Handling
```typescript
peerConnection.oniceconnectionstate = (event) => {
  switch (peerConnection.iceConnectionState) {
    case 'checking':
      setStatus('Connecting...');
      break;
    case 'connected':
      setStatus('Live');
      break;
    case 'disconnected':
      setStatus('Reconnecting...');
      attemptReconnect();
      break;
    case 'failed':
      setStatus('Connection failed');
      showChatOnlyMode();
      break;
  }
};
```

### Chat-Only Fallback
When video fails completely:
- Chat panel remains active
- Market overlays display
- Audio-only mode offered (planned)
- User can refresh to retry video

---

## 7. Audio-Only Mode (Planned)

### Timeline: Q1 2026

### Use Cases
- Users on poor connections
- NAT traversal failures
- Bandwidth-constrained viewers

### Implementation
- Strip video track from stream
- Send audio-only via WebRTC or fallback to WebSocket audio chunks
- Display avatar/cover image instead of video
- Significantly lower bandwidth (~50-100 kbps vs 1-3 Mbps)

---

## 8. Recording & Replays

### Status: NOT IMPLEMENTED

### Planned Implementation (Q2 2026)
| Feature | Storage | Retention |
|---------|---------|-----------|
| Stream recording | Cloud storage (S3/R2) | 30 days |
| Clip generation | On-demand processing | Permanent |
| Replay viewing | CDN-delivered HLS | 30 days |

### Recording Architecture
```
[WebRTC Stream] → [Media Recorder API] → [Chunks]
                                            ↓
                              [Upload to S3/R2]
                                            ↓
                              [Transcode to HLS]
                                            ↓
                              [CDN Distribution]
```

---

## 9. Concurrency & Rate Limits

### Current Limits
| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Concurrent streams (global) | 100 | Soft limit |
| Concurrent viewers per stream | 50 | Connection-based |
| Chat messages per minute | 60 per user | Rate limited |
| Stream duration | No limit | N/A |
| Reconnection attempts | 5 per minute | Exponential backoff |

### Future Limits (with SFU)
| Resource | Limit | Notes |
|----------|-------|-------|
| Concurrent streams | 1,000+ | SFU-dependent |
| Viewers per stream | 10,000+ | CDN-based |
| Chat messages | 120/min | Scaled backend |

---

## 10. Bandwidth Requirements

### Broadcaster
| Quality | Resolution | Bitrate | Notes |
|---------|------------|---------|-------|
| Low | 480p | 1 Mbps | Mobile-friendly |
| Medium | 720p | 2.5 Mbps | Default |
| High | 1080p | 5 Mbps | Desktop |

### Viewer
| Quality | Bitrate Down | Notes |
|---------|--------------|-------|
| Adaptive | 0.5-5 Mbps | Based on connection |

---

## 11. Known Limitations

1. **No TURN** - ~15% of users behind symmetric NAT cannot connect
2. **P2P cap** - Practical limit of ~50 viewers per stream
3. **No recordings** - Streams not saved for replay
4. **Single server** - WebSocket signaling not horizontally scaled
5. **No adaptive bitrate** - Fixed quality, no dynamic adjustment

---

## 12. Scaling Roadmap

| Phase | Timeline | Capability |
|-------|----------|------------|
| Current | NOW | 50 viewers/stream, STUN only |
| Phase 2 | Q1 2026 | TURN for NAT traversal, 90%+ connectivity |
| Phase 3 | Q2 2026 | SFU for 500+ viewers, recording |
| Phase 4 | Q3 2026 | CDN for 10,000+ viewers, global edge |

---

## Summary

StreamAiX streaming is **LIVE** with pure P2P WebRTC, supporting up to ~50 viewers per stream. TURN servers are planned for Q1 2026 to resolve NAT traversal issues affecting ~15% of users. SFU migration (LiveKit or similar) is planned for Q2 2026 to support 500+ viewers per stream. Chat and overlays remain functional even when video connection fails.
