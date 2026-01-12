import type {
	ItemGroupDto,
	ParticipantDto,
	PaymentMethodDto,
	ReceiptDto,
	ReceiptImagesResponseDto,
	ReceiptItemDto,
	SplitDto,
	SplitItemDto,
	UserDto,
	UserMeDto,
} from '@chopcheck/shared'

import type {
	ItemGroup,
	ItemWithReceiptData,
	ParticipantWithUser,
	PaymentMethod,
	Receipt,
	ReceiptItem,
	Split,
	User,
} from '@/common/types'

// Helper to handle dates that might be strings (from cache) or Date objects (from DB)
function toIso(date: Date | string | undefined | null): string {
	if (!date) return new Date().toISOString()
	return typeof date === 'string' ? date : date.toISOString()
}

function toIsoOptional(date: Date | string | undefined | null): string | undefined {
	if (!date) return undefined
	return typeof date === 'string' ? date : date.toISOString()
}

export function toUserDto(user: User): UserDto {
	return {
		id: user.id,
		displayName: user.displayName,
		username: user.username,
		avatarUrl: user.avatarUrl,
		telegramId: user.telegramId,
	}
}

export function toUserMeDto(user: User): UserMeDto {
	return {
		...toUserDto(user),
		preferences: (user.preferences as Record<string, unknown>) || {},
		createdAt: toIso(user.createdAt),
	}
}

export function toPaymentMethodDto(pm: PaymentMethod): PaymentMethodDto {
	return {
		id: pm.id,
		userId: pm.userId,
		type: pm.type,
		displayName: pm.displayName,
		currency: pm.currency,
		paymentData: pm.paymentData as Record<string, unknown>,
		isTemporary: pm.isTemporary,
		isDefault: pm.isDefault,
		displayOrder: pm.displayOrder,
		createdAt: toIso(pm.createdAt),
		updatedAt: toIso(pm.updatedAt),
	}
}

export function toReceiptItemDto(item: ReceiptItem): ReceiptItemDto {
	return {
		id: item.id,
		rawName: item.rawName,
		name: item.name || undefined,
		category: item.category || undefined,
		subcategory: item.subcategory || undefined,
		emoji: item.emoji || undefined,
		price: item.price,
		quantity: item.quantity,
		unit: item.unit || undefined,
		sum: item.sum,
		discount: item.discount || undefined,
		suggestedSplitMethod: item.suggestedSplitMethod || undefined,
		warnings: (item.warnings as any) || undefined,
		bbox: (item.bbox as any) || null,
	}
}

export function toReceiptDto(receipt: Receipt): ReceiptDto {
	return {
		id: receipt.id,
		userId: receipt.userId,
		source: receipt.source,
		status: receipt.status,
		placeName: receipt.placeName || undefined,
		total: receipt.total,
		currency: receipt.currency,
		receiptDate: toIsoOptional(receipt.receiptDate),
		imageMetadata: (receipt.imageMetadata as any) || undefined,
		savedImages: (receipt.savedImages as any) || undefined,
		createdAt: toIso(receipt.createdAt),
	}
}

export function toReceiptImagesDto(data: {
	receipt: Receipt
	items: ReceiptItem[]
	imageMetadata: unknown[]
	savedImages: unknown[]
}): ReceiptImagesResponseDto {
	return {
		receiptId: data.receipt.id,
		imageMetadata: (data.imageMetadata as any) || [],
		savedImages: (data.savedImages as any) || [],
		items: data.items.map(toReceiptItemDto),
	}
}

export function toSplitDto(split: Split): SplitDto {
	return {
		id: split.id,
		shortId: split.shortId,
		name: split.name,
		icon: split.icon,
		currency: split.currency,
		status: split.status,
		phase: split.phase,
		maxParticipants: split.maxParticipants,
		expectedParticipants: split.expectedParticipants,
		createdAt: toIso(split.createdAt),
		updatedAt: toIso(split.updatedAt),
	}
}

export function toSplitItemDto(item: ItemWithReceiptData): SplitItemDto {
	return {
		id: item.id,
		name: item.name,
		price: item.price,
		quantity: item.quantity || '1',
		type: item.type,
		defaultDivisionMethod: item.defaultDivisionMethod,
		icon: item.icon,
		groupId: item.groupId,
		unit: item.unit || 'piece',
		warnings: (item.warnings as any) || [],
		// Map receipt data if available
		bbox: (item.receiptItem?.bbox as any) || null,
		receiptId: item.receiptItem?.receiptId || null,
	}
}

export function toItemGroupDto(group: ItemGroup): ItemGroupDto {
	return {
		id: group.id,
		splitId: group.splitId,
		name: group.name,
		type: group.type,
		icon: group.icon,
		displayOrder: group.displayOrder,
		isCollapsed: group.isCollapsed,
		warnings: (group.warnings as any) || [],
		createdAt: toIso(group.createdAt),
		receiptId: group.receiptId,
	}
}

export function toParticipantDto(p: ParticipantWithUser): ParticipantDto {
	return {
		id: p.id,
		userId: p.userId,
		displayName: p.displayName,
		isAnonymous: p.isAnonymous,
		joinedAt: toIso(p.joinedAt),
		user: p.user ? toUserDto(p.user as User) : null,
	}
}
