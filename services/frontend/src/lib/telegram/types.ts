export interface TelegramAuth {
	authDate: string;
	hash: string;
	queryId: string;
	signature: string;
	user: TelegramUser;
}

interface TelegramUser {
	id: number;
	firstName: string;
	lastName: string;
	photoUrl: string;
	allowsWriteToPm: true;
}
