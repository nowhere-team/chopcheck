// file: services/backend/src/common/types/entities.ts
import type { ImageMetadata, ItemBbox, SavedImageInfo } from '@nowhere-team/catalog/types'

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

// enriched receipt with typed image data
export interface ReceiptWithImageData extends Receipt {
	imageMetadata: ImageMetadata[]
	savedImages: SavedImageInfo[]
}

// receipt item with typed bbox
export interface ReceiptItemWithBbox extends ReceiptItem {
	bbox: ItemBbox | null
}

// re-export catalog types for convenience
export type { ImageMetadata, ItemBbox, SavedImageInfo } from '@nowhere-team/catalog/types'
