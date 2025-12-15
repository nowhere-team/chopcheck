import type { schema } from '@/platform/database'

export type User = typeof schema.users.$inferSelect
export type Split = typeof schema.splits.$inferSelect
export type Item = typeof schema.splitItems.$inferSelect
export type ItemGroup = typeof schema.splitItemGroups.$inferSelect
export type Participant = typeof schema.splitParticipants.$inferSelect
export type ParticipantItem = typeof schema.splitItemParticipants.$inferSelect
export type Receipt = typeof schema.receipts.$inferSelect
export type ReceiptItem = typeof schema.receiptItems.$inferSelect

export type ParticipantWithUser = Participant & {
	user: Pick<User, 'id' | 'displayName' | 'username' | 'avatarUrl' | 'isDeleted'> | null
}

export type ParticipantWithSelections = ParticipantWithUser & {
	itemParticipations: ParticipantItem[]
}
