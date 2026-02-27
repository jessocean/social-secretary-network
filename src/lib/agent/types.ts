/**
 * Agent Negotiation Engine - Type Definitions
 *
 * Pure data types for the deterministic scheduling algorithm.
 * No runtime dependencies - these are used across scheduler, scorer, and negotiator.
 */

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** A contiguous block of free time for a single user. */
export interface FreeSlot {
  start: Date;
  end: Date;
  userId: string;
}

/** A time window where two or more users are simultaneously free. */
export interface OverlapSlot {
  start: Date;
  end: Date;
  userIds: string[];
}

/** An OverlapSlot that has been run through the scoring pipeline. */
export interface ScoredSlot extends OverlapSlot {
  score: number;
  scoreBreakdown: Record<string, number>;
}

/** All availability information for a single user in a given period. */
export interface UserAvailability {
  userId: string;
  freeSlots: FreeSlot[];
  constraints: Constraint[];
}

// ---------------------------------------------------------------------------
// Constraints & Preferences
// ---------------------------------------------------------------------------

/** A recurring time block that removes availability (e.g. nap, work). */
export interface Constraint {
  type: "sleep" | "nap" | "transit" | "work" | "custom";
  /** Lowercase abbreviated day names: "mon","tue","wed","thu","fri","sat","sun" */
  days: string[];
  /** HH:mm format, e.g. "13:00" */
  startTime: string;
  /** HH:mm format, e.g. "14:30" */
  endTime: string;
}

/** User-level scheduling preferences. */
export interface UserPrefs {
  maxEventsPerWeek: number;
  preferredTypes: string[];
  bufferMinutes: number;
  preferMornings: boolean;
  preferAfternoons: boolean;
  preferEvenings: boolean;
  preferWeekends: boolean;
  weatherSensitive: boolean;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** Contextual data fed into the scorer alongside the slot & prefs. */
export interface ScoringContext {
  /** The engagement type being scored (e.g. "coffee", "playground"). */
  proposedType: string;
  /** Number of events already scheduled this week, keyed by userId. */
  currentWeekEventCount: Map<string, number>;
  /**
   * Days since last hangout with each friend, keyed by
   * a deterministic pair key (sorted concatenation of userIds).
   * If a pair is missing, defaults to 14.
   */
  lastHangoutDays: Map<string, number>;
  /** Optional travel time in minutes for each user, keyed by userId. */
  travelMinutes?: Map<string, number>;
}

// ---------------------------------------------------------------------------
// Proposals / Negotiation
// ---------------------------------------------------------------------------

/** A fully-formed proposal candidate ready for presentation. */
export interface ProposalCandidate {
  slot: ScoredSlot;
  type: string;
  title: string;
  locationName?: string;
  locationId?: string;
  participants: string[];
}

/** The output of a full negotiation run. */
export interface NegotiationResult {
  proposals: ProposalCandidate[];
  log: { timestamp: string; message: string }[];
}

/** Input parameters for the negotiate() function. */
export interface NegotiationParams {
  users: UserAvailability[];
  preferences: Map<string, UserPrefs>;
  friendships: { userId: string; friendId: string; priority: number }[];
  locations: {
    userId: string;
    locationName: string;
    locationId: string;
    travelMinutes: number;
  }[];
  weekStart: Date;
  engagementTypes: string[];
}
