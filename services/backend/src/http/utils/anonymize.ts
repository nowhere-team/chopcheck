import type { ParticipantWithSelections, SplitResponse } from '@/common/types'

function getStableAnonymousName(participantId: string): string {
	const hash = participantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
	const number = (hash % 999) + 1
	return `Guest ${number}`
}

export function anonymizeParticipant(participant: ParticipantWithSelections): ParticipantWithSelections {
	if (!participant.isAnonymous) {
		return participant
	}

	return {
		...participant,
		userId: null,
		displayName: participant.displayName || getStableAnonymousName(participant.id),
		user: null,
	}
}

export function anonymizeSplitResponse(response: SplitResponse): SplitResponse {
	return {
		...response,
		participants: response.participants.map(anonymizeParticipant),
		calculations: response.calculations
			? {
					...response.calculations,
					participants: response.calculations.participants.map(calc => {
						const participant = response.participants.find(p => p.id === calc.participantId)

						if (participant?.isAnonymous) {
							return {
								...calc,
								displayName: participant.displayName || getStableAnonymousName(participant.id),
							}
						}

						return calc
					}),
				}
			: undefined,
	}
}
