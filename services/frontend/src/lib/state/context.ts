import { getContext, setContext } from 'svelte'

import type { ContactsService } from './stores/contacts.svelte'
import type { PaymentMethodsService } from './stores/payment-methods.svelte'
import type { SplitsService } from './stores/splits.svelte'
import type { UserService } from './stores/user.svelte'

const KEYS = {
	USER: Symbol('USER'),
	SPLITS: Symbol('SPLITS'),
	CONTACTS: Symbol('CONTACTS'),
	PAYMENT_METHODS: Symbol('PAYMENT_METHODS')
}

export function setUserService(service: UserService) {
	setContext(KEYS.USER, service)
	return service
}

export function getUserService() {
	return getContext<UserService>(KEYS.USER)
}

export function setSplitsService(service: SplitsService) {
	setContext(KEYS.SPLITS, service)
	return service
}

export function getSplitsService() {
	return getContext<SplitsService>(KEYS.SPLITS)
}

export function setContactsService(service: ContactsService) {
	setContext(KEYS.CONTACTS, service)
	return service
}

export function getContactsService() {
	return getContext<ContactsService>(KEYS.CONTACTS)
}

export function setPaymentMethodsService(service: PaymentMethodsService) {
	setContext(KEYS.PAYMENT_METHODS, service)
	return service
}

export function getPaymentMethodsService() {
	return getContext<PaymentMethodsService>(KEYS.PAYMENT_METHODS)
}
