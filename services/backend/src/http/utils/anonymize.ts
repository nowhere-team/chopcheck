import type { ParticipantWithSelections, SplitResponse } from '@/common/types'

/**
 * Anonymizes participant data by hiding user information for anonymous participants
 */
export function anonymizeParticipant(participant: ParticipantWithSelections): ParticipantWithSelections {
	if (!participant.isAnonymous) {
		return participant
	}

	return {
		...participant,
		user: participant.user
			? {
					...participant.user,
					displayName: participant.displayName || 'Guest',
					username: null,
					avatarUrl: null,
				}
			: null,
	}
}

/**
 * Anonymizes all participants in a split response
 */
export function anonymizeSplitResponse(response: SplitResponse): SplitResponse {
	return {
		...response,
		participants: response.participants.map(anonymizeParticipant),
	}
}
