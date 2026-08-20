import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression tests for the stream_conversation_messages.participant_id FK.
 *
 * The scheduled market stream previously stored the avatar's knowledge_avatars.id
 * in participant_id, which is a FK to stream_participants.id — a guaranteed FK
 * violation in production. deliverCommentary must now register/reuse a valid
 * stream_participants row for the host avatar and reference ITS id.
 */

// --- db mock: records participant inserts/selects and message inserts --------
const dbState: {
  participants: Array<{ id: string; streamId: string; avatarId: string; participantType: string; role: string }>;
  messages: Array<{ streamId: string; participantId: string; speakerAvatarId: string }>;
  nextParticipantId: number;
  existingParticipantId: string | null;
} = { participants: [], messages: [], nextParticipantId: 1, existingParticipantId: null };

vi.mock('../../db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () =>
            dbState.existingParticipantId ? [{ id: dbState.existingParticipantId }] : [],
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (vals: any) => ({
        returning: async () => {
          const id = `sp-${dbState.nextParticipantId++}`;
          dbState.participants.push({ id, ...vals });
          return [{ id }];
        },
      }),
      // message inserts don't call .returning()
    }),
  },
}));

// Distinguish participant inserts (with .returning) from message inserts.
// The message insert path calls db.insert(...).values(...) and awaits it, so
// we return a thenable that also records the row.
vi.mock('@shared/schema', async (orig) => {
  const actual: any = await orig();
  return actual;
});

// Silence heavy dependencies pulled in by the service module.
vi.mock('../streamingService', () => ({
  getStreamingService: () => ({ sendAiMessage: vi.fn(), createAvatarStreamSession: vi.fn() }),
}));
vi.mock('../marketDataService', () => ({
  MarketDataService: { getInstance: () => ({}) },
}));
vi.mock('../avatarVoiceService', () => ({ AvatarVoiceService: class {} }));
vi.mock('../pushNotificationService', () => ({ pushNotificationService: { sendToAll: vi.fn() } }));
vi.mock('../../lib/modelGateway', () => ({ modelGateway: { complete: vi.fn() } }));
vi.mock('../../jobs/scheduler', () => ({ jobScheduler: { registerCron: vi.fn(), cancel: vi.fn() } }));

import { ScheduledMarketStreamService } from '../scheduledMarketStreamService';

describe('scheduled stream participant FK safety', () => {
  beforeEach(() => {
    dbState.participants = [];
    dbState.messages = [];
    dbState.nextParticipantId = 1;
    dbState.existingParticipantId = null;
  });

  it('creates a stream_participants row and uses its id (not the avatar id) as participant_id', async () => {
    const svc: any = new ScheduledMarketStreamService();
    const avatar = { id: 'avatar-123', name: 'Nova' };

    const pid = await svc.ensureAvatarParticipant('stream-1', avatar);

    // A participant row was created, of type 'avatar' and role 'host'.
    expect(dbState.participants).toHaveLength(1);
    expect(dbState.participants[0]).toMatchObject({
      streamId: 'stream-1',
      avatarId: 'avatar-123',
      participantType: 'avatar',
      role: 'host',
    });
    // The returned id is the participant row id, NOT the avatar id.
    expect(pid).toBe(dbState.participants[0].id);
    expect(pid).not.toBe(avatar.id);
  });

  it('reuses an existing participant row rather than creating duplicates', async () => {
    dbState.existingParticipantId = 'sp-existing';
    const svc: any = new ScheduledMarketStreamService();
    const avatar = { id: 'avatar-123', name: 'Nova' };

    const pid = await svc.ensureAvatarParticipant('stream-1', avatar);
    expect(pid).toBe('sp-existing');
    // No new participant row inserted.
    expect(dbState.participants).toHaveLength(0);
  });

  it('deliverCommentary references a real participant id for every saved message', async () => {
    const svc: any = new ScheduledMarketStreamService();
    const avatar = { id: 'avatar-xyz', name: 'Nova', imageUrl: null };

    // Capture message inserts by spying on db.insert for the message table.
    const { db } = await import('../../db');
    const messageInserts: any[] = [];
    const origInsert = (db as any).insert;
    (db as any).insert = (table: any) => {
      const builder = origInsert(table);
      const origValues = builder.values;
      builder.values = (vals: any) => {
        // Participant inserts have participantType; message inserts have textContent.
        if (vals.textContent !== undefined) {
          messageInserts.push(vals);
          return Promise.resolve([{ id: 'msg' }]);
        }
        return origValues(vals);
      };
      return builder;
    };

    // Single segment avoids the inter-segment pacing setTimeout.
    await svc.deliverCommentary('stream-1', avatar, ['segment one']);

    (db as any).insert = origInsert;

    // A participant row was created and every message points at it.
    expect(dbState.participants).toHaveLength(1);
    const participantId = dbState.participants[0].id;
    expect(messageInserts).toHaveLength(1);
    for (const m of messageInserts) {
      expect(m.participantId).toBe(participantId);
      expect(m.participantId).not.toBe(avatar.id); // never the raw avatar id
      expect(m.speakerAvatarId).toBe(avatar.id);   // denormalized avatar identity preserved
    }
  });

});
