import type { Contact, ContactsFilter } from '@/common/types'
import type { Logger } from '@/platform/logger'
import type { ContactsRepository } from '@/repositories'

export class ContactsService {
	constructor(
		private readonly repo: ContactsRepository,
		private readonly logger: Logger,
	) {}

	async getMyContacts(userId: string, filter: ContactsFilter = {}): Promise<Contact[]> {
		const contacts = await this.repo.findByUserId(userId, filter)
		return contacts.filter(c => !c.isDeleted)
	}

	async getContactWithFinance(userId: string, contactId: string): Promise<Contact | null> {
		const contacts = await this.repo.findByUserId(userId, { limit: 1000 })
		const contact = contacts.find(c => c.userId === contactId)

		if (!contact) return null

		const finance = await this.repo.getFinancialStats(userId, contactId)
		return { ...contact, metadata: { totalOwed: finance.totalOwed, totalOwing: finance.totalOwing } }
	}
}
