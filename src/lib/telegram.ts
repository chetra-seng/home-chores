import { env } from '$env/dynamic/private';
const TELEGRAM_URL = 'https://api.telegram.org/bot';

export const sendMessage = async (message: string, option: string) => {
	await fetch(
		`${TELEGRAM_URL}${env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${env.TELEGRAM_CHAT_ID}&text=${message}&reply_markup=${option}`
	);
};
