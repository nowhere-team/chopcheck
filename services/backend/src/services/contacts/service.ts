import type { Contact, ContactsFilter } from '@/common/types/contacts'
import type { Logger } from '@/platform/logger'
import type { ContactsRepository } from '@/repositories/contacts'

export class ContactsService {
	constructor(
		private contactsRepo: ContactsRepository,
		private logger: Logger,
	) {}

	async getMyContacts(userId: string, filter: ContactsFilter = {}): Promise<Contact[]> {
		this.logger.debug('fetching user contacts', { userId, filter })

		const contacts = await this.contactsRepo.findByUserId(userId, filter)

		this.logger.debug('contacts found', { userId, count: contacts.length })

		return filter.query ? contacts : contacts.filter(c => !c.isDeleted)
	}

	async getContactWithFinance(userId: string, contactId: string): Promise<Contact | null> {
		const contacts = await this.contactsRepo.findByUserId(userId, { limit: 1000 })
		const contact = contacts.find(c => c.userId === contactId)

		if (!contact) return null

		const finance = await this.contactsRepo.getContactFinancialStats(userId, contactId)

		return {
			...contact,
			metadata: {
				totalOwed: finance.totalOwed,
				totalOwing: finance.totalOwing,
			},
		}
	}

	async searchContacts(userId: string, query: string, limit: number = 20): Promise<Contact[]> {
		return this.getMyContacts(userId, { query, limit, sortBy: 'frequent' })
	}
}
