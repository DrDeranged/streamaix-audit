import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  walletAddress: text("wallet_address"),
  ensName: text("ens_name"),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const summaries = pgTable("summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  originalUrl: text("original_url").notNull(),
  originalDuration: integer("original_duration"), // in seconds
  contentType: text("content_type").notNull(), // podcast, video, livestream
  platform: text("platform").notNull(), // youtube, spotify, twitch, etc
  transcript: text("transcript"),
  summary: text("summary"),
  keyInsights: jsonb("key_insights"), // array of insight objects
  chapters: jsonb("chapters"), // array of chapter objects
  tags: text("tags").array(),
  creatorId: varchar("creator_id").references(() => users.id),
  isPublic: boolean("is_public").default(true),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  accuracy: integer("accuracy"), // percentage
  arweaveId: text("arweave_id"), // decentralized storage reference
  ipfsHash: text("ipfs_hash"), // alternative decentralized storage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bounties = pgTable("bounties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contentUrl: text("content_url").notNull(),
  reward: integer("reward").notNull(), // in $STREAM tokens
  tipPool: integer("tip_pool").default(0), // additional tips in cents
  deadline: timestamp("deadline"),
  tags: text("tags").array(),
  creatorId: varchar("creator_id").references(() => users.id),
  assigneeId: varchar("assignee_id").references(() => users.id),
  summaryId: varchar("summary_id").references(() => summaries.id),
  status: text("status").notNull().default("open"), // open, claimed, in_progress, completed, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  summaryId: varchar("summary_id").references(() => summaries.id).notNull(),
  interactionType: text("interaction_type").notNull(), // like, bookmark, share, view
  metadata: jsonb("metadata"), // additional interaction data
  createdAt: timestamp("created_at").defaultNow(),
});

export const knowledgeStacks = pgTable("knowledge_stacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  summaryIds: text("summary_ids").array(), // array of summary IDs
  isPublic: boolean("is_public").default(true),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  summaries: many(summaries),
  bounties: many(bounties),
  knowledgeStacks: many(knowledgeStacks),
  interactions: many(userInteractions),
}));

export const summariesRelations = relations(summaries, ({ one, many }) => ({
  creator: one(users, {
    fields: [summaries.creatorId],
    references: [users.id],
  }),
  bounty: one(bounties, {
    fields: [summaries.id],
    references: [bounties.summaryId],
  }),
  interactions: many(userInteractions),
}));

export const bountiesRelations = relations(bounties, ({ one }) => ({
  creator: one(users, {
    fields: [bounties.creatorId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [bounties.assigneeId],
    references: [users.id],
  }),
  summary: one(summaries, {
    fields: [bounties.summaryId],
    references: [summaries.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userInteractions.userId],
    references: [users.id],
  }),
  summary: one(summaries, {
    fields: [userInteractions.summaryId],
    references: [summaries.id],
  }),
}));

export const knowledgeStacksRelations = relations(knowledgeStacks, ({ one }) => ({
  creator: one(users, {
    fields: [knowledgeStacks.creatorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  walletAddress: true,
  ensName: true,
  avatar: true,
  bio: true,
});

export const insertSummarySchema = createInsertSchema(summaries).pick({
  title: true,
  description: true,
  originalUrl: true,
  originalDuration: true,
  contentType: true,
  platform: true,
  transcript: true,
  summary: true,
  keyInsights: true,
  chapters: true,
  tags: true,
  creatorId: true,
  isPublic: true,
  processingStatus: true,
  accuracy: true,
  arweaveId: true,
  ipfsHash: true,
});

export const insertBountySchema = createInsertSchema(bounties).pick({
  title: true,
  description: true,
  contentUrl: true,
  reward: true,
  deadline: true,
  tags: true,
  creatorId: true,
});

export const insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
  userId: true,
  summaryId: true,
  interactionType: true,
  metadata: true,
});

export const insertKnowledgeStackSchema = createInsertSchema(knowledgeStacks).pick({
  title: true,
  description: true,
  creatorId: true,
  summaryIds: true,
  isPublic: true,
  tags: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;

export type InsertBounty = z.infer<typeof insertBountySchema>;
export type Bounty = typeof bounties.$inferSelect;

export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;

export type InsertKnowledgeStack = z.infer<typeof insertKnowledgeStackSchema>;
export type KnowledgeStack = typeof knowledgeStacks.$inferSelect;
