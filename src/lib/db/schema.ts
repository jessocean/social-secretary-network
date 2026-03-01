import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "active",
  "calendar_only",
  "declined",
]);

export const inviteTypeEnum = pgEnum("invite_type", [
  "full",
  "calendar_only",
]);

export const negotiationStatusEnum = pgEnum("negotiation_status", [
  "pending",
  "negotiating",
  "proposed",
  "confirmed",
  "cancelled",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "proposed",
  "accepted",
  "declined",
  "confirmed",
  "cancelled",
]);

export const participantResponseEnum = pgEnum("participant_response", [
  "pending",
  "accepted",
  "declined",
  "tentative",
]);

export const constraintTypeEnum = pgEnum("constraint_type", [
  "sleep",
  "nap",
  "transit",
  "work",
  "custom",
]);

export const engagementTypeEnum = pgEnum("engagement_type", [
  "playground",
  "coffee",
  "playdate_home",
  "dinner",
  "park",
  "class",
  "walk",
  "other",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  onboardingStep: integer("onboarding_step").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const googleCalendarConnections = pgTable("google_calendar_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  calendarId: text("calendar_id"),
  sandboxCalendarId: text("sandbox_calendar_id"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  googleEventId: text("google_event_id"),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBusy: boolean("is_busy").default(true).notNull(),
  isAllDay: boolean("is_all_day").default(false).notNull(),
  source: text("source").default("mock").notNull(), // mock | google | manual
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userConstraints = pgTable("user_constraints", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: constraintTypeEnum("type").notNull(),
  label: text("label"),
  days: jsonb("days").$type<string[]>().default([]).notNull(), // ["mon","tue",...]
  startTime: text("start_time").notNull(), // "HH:mm"
  endTime: text("end_time").notNull(), // "HH:mm"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  maxEventsPerWeek: integer("max_events_per_week").default(3).notNull(),
  preferredTypes: jsonb("preferred_types").$type<string[]>().default([]).notNull(),
  bufferMinutes: integer("buffer_minutes").default(30).notNull(),
  preferMornings: boolean("prefer_mornings").default(false).notNull(),
  preferAfternoons: boolean("prefer_afternoons").default(true).notNull(),
  preferEvenings: boolean("prefer_evenings").default(false).notNull(),
  preferWeekends: boolean("prefer_weekends").default(true).notNull(),
  weatherSensitive: boolean("weather_sensitive").default(false).notNull(),
  rainAlternative: text("rain_alternative"), // indoor fallback
  openHouseDay: text("open_house_day"), // e.g. "saturday"
  openHouseStart: text("open_house_start"), // "HH:mm"
  openHouseEnd: text("open_house_end"), // "HH:mm"
  openHouseNote: text("open_house_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userLocations = pgTable("user_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").notNull(), // "Home", "Central Park Playground", etc.
  type: text("type").notNull(), // home | playground | cafe | park | other
  lat: real("lat"),
  lng: real("lng"),
  address: text("address"),
  travelMinutes: integer("travel_minutes").default(0),
  hostingOk: boolean("hosting_ok").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  friendId: uuid("friend_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: friendshipStatusEnum("status").default("pending").notNull(),
  priority: integer("priority").default(5).notNull(), // 1-10 scale
  nickname: text("nickname"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: inviteTypeEnum("type").default("full").notNull(),
  usedBy: uuid("used_by").references(() => users.id),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const negotiations = pgTable("negotiations", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: negotiationStatusEnum("status").default("pending").notNull(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  context: jsonb("context").$type<Record<string, unknown>>(),
  log: jsonb("log").$type<Array<{ timestamp: string; message: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  negotiationId: uuid("negotiation_id")
    .references(() => negotiations.id, { onDelete: "cascade" })
    .notNull(),
  type: engagementTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  locationId: uuid("location_id").references(() => userLocations.id),
  locationName: text("location_name"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: proposalStatusEnum("status").default("draft").notNull(),
  score: real("score"),
  scoreBreakdown: jsonb("score_breakdown").$type<Record<string, number>>(),
  messageTemplate: text("message_template"),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proposalParticipants = pgTable("proposal_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id")
    .references(() => proposals.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  response: participantResponseEnum("response").default("pending").notNull(),
  isOrganizer: boolean("is_organizer").default(false).notNull(),
  respondedAt: timestamp("responded_at"),
  messagesSent: jsonb("messages_sent").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  calendarConnection: one(googleCalendarConnections, {
    fields: [users.id],
    references: [googleCalendarConnections.userId],
  }),
  calendarEvents: many(calendarEvents),
  constraints: many(userConstraints),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  locations: many(userLocations),
  friendships: many(friendships),
  invitesCreated: many(invites),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
}));

export const userConstraintsRelations = relations(userConstraints, ({ one }) => ({
  user: one(users, {
    fields: [userConstraints.userId],
    references: [users.id],
  }),
}));

export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "user",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friend",
  }),
}));

export const negotiationsRelations = relations(negotiations, ({ many }) => ({
  proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  negotiation: one(negotiations, {
    fields: [proposals.negotiationId],
    references: [negotiations.id],
  }),
  participants: many(proposalParticipants),
}));

export const proposalParticipantsRelations = relations(
  proposalParticipants,
  ({ one }) => ({
    proposal: one(proposals, {
      fields: [proposalParticipants.proposalId],
      references: [proposals.id],
    }),
    user: one(users, {
      fields: [proposalParticipants.userId],
      references: [users.id],
    }),
  })
);
