import { cloudStorage } from '@telegram-apps/sdk'

export async function saveToken(token: string): Promise<void> {
	try {
		await cloudStorage.setItem('auth_token', token)
	} catch {
		sessionStorage.setItem('auth_token', token)
	}
}

export async function getToken(): Promise<string | null> {
	try {
		return await cloudStorage.getItem('auth_token')
	} catch {
		return sessionStorage.getItem('auth_token')
	}
}

export async function clearToken(): Promise<void> {
	try {
		await cloudStorage.deleteItem('auth_token')
	} catch {
		sessionStorage.removeItem('auth_token')
	}
}
