import type { ParticipantWithSelections, SplitResponse } from '@/common/types'

function getAnonymousName(participantId: string): string {
	const hash = participantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
	return `Guest ${(hash % 999) + 1}`
}

export function anonymizeParticipant(p: ParticipantWithSelections): ParticipantWithSelections {
	if (!p.isAnonymous) return p
	return { ...p, userId: null, displayName: p.displayName || getAnonymousName(p.id), user: null }
}

export function anonymizeSplitResponse(response: SplitResponse): SplitResponse {
	return {
		...response,
		participants: response.participants.map(anonymizeParticipant),
		calculations: response.calculations
			? {
					...response.calculations,
					participants: response.calculations.participants.map(calc => {
						const p = response.participants.find(p => p.id === calc.participantId)
						if (p?.isAnonymous) {
							return { ...calc, displayName: p.displayName || getAnonymousName(p.id) }
						}
						return calc
					}),
				}
			: undefined,
	}
}
