import * as schema from '@/platform/database/schema'

// database entities
export type User = typeof schema.users.$inferSelect
export type Split = typeof schema.splits.$inferSelect
export type Item = typeof schema.splitItems.$inferSelect
export type Participant = typeof schema.splitParticipants.$inferSelect
export type ParticipantItem = typeof schema.splitItemParticipants.$inferSelect

// extended types
export type ParticipantWithUser = Participant & {
	user: Pick<User, 'id' | 'displayName' | 'username' | 'avatarUrl' | 'isDeleted'> | null
}
export type DetailedSplit = { split: Split; items: Item[]; participants: ParticipantWithUser[] }
