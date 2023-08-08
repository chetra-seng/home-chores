import { env } from '$env/dynamic/private';
import { OAuth2Client } from 'google-auth-library';

const oAuthClient = new OAuth2Client(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	env.GOOGLE_REDIRECT_URL
);

export { oAuthClient };
