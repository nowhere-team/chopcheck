import { isTMA } from '@telegram-apps/bridge';
import {
	init as sdkInit,
	requestFullscreen,
	retrieveLaunchParams,
	viewport
} from '@telegram-apps/sdk';

import type { TelegramAuth } from '$telegram/types';

// we don't need call init multiple times, just once when app opened, so introduce caching mechanism
let initPromise: Promise<InitResult> | null = null;
const cachedResult: InitResult | null = null;

interface InitResult {
	cleanup: (() => void) | null;
	viewport: typeof viewport;
	insets: ReturnType<typeof viewport.safeAreaInsets>;
	platform: string;
	auth: TelegramAuth;
}

export async function init() {
	if (cachedResult) return cachedResult;
	if (initPromise) return initPromise;

	if (!isTMA()) {
		throw new Error('not telegram app');
	}

	initPromise = sdk();
	return initPromise;
}

async function sdk(): Promise<InitResult> {
	const cleanup = sdkInit();
	const { tgWebAppData: auth, tgWebAppPlatform: platform } = retrieveLaunchParams(true);

	await viewport.mount({ timeout: 500 });
	if (isMobile(platform) && requestFullscreen.isAvailable()) {
		await requestFullscreen();
	}

	const insets = viewport.safeAreaInsets();

	return { cleanup, viewport, insets, platform, auth: auth as unknown as TelegramAuth };
}

export function isMobile(platform: string) {
	return platform === 'ios' || platform === 'android';
}
