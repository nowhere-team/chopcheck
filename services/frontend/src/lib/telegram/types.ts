export interface TelegramAuth {
	authDate: string
	hash: string
	queryId: string
	signature: string
	user: TelegramUser
}

export interface TelegramUser {
	id: number
	firstName: string
	lastName: string
	photoUrl: string
	allowsWriteToPm: true
}

export interface TelegramTheme {
	bgColor?: string
	textColor?: string
	hintColor?: string
	buttonColor?: string
	buttonTextColor?: string
	secondaryBgColor?: string
	sectionBgColor?: string
	subtitleTextColor?: string
}
