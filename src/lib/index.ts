import { env } from '$env/dynamic/private';
import { env as envPub } from '$env/dynamic/public';
import { Client, isFullPageOrDatabase } from '@notionhq/client';
import { OAuth2Client } from 'google-auth-library';
import moment from 'moment';
import EventEmitter from 'events';
import { sendMessage } from './telegram';
import databases from './databases.json';

/**
 * * Used to triggered specific events such as update operation
 */
const eventEmitter = new EventEmitter();

/**
 * * Google client initialization
 */
const oAuthClient = new OAuth2Client(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	env.GOOGLE_REDIRECT_URL
);

/**
 * * Notion client itialization
 */
const notion = new Client({
	auth: env.NOTION_CLIENT_SECRET,
});

/**
 * * Get a list of schedules from notion database via notion client
 * @param dbId notion database id
 * @param cursor notion database cursor used to get data for pagination
 * @returns a list of schedules from notion database
 */
const getChoreSchedules = async (dbId: string, cursor: string) => {
	const dbContent = await notion.databases.query({
		database_id: dbId,
		page_size: 10,
		start_cursor: cursor !== 'null' && cursor.length > 0 ? cursor : undefined,
		sorts: [
			{
				property: 'Done',
				direction: 'ascending',
			},
			{
				property: 'Completed Date',
				direction: 'descending',
			},
			{
				property: 'Created time',
				direction: 'ascending',
			},
		],
	});

	// * Making the results more readable
	const result = dbContent.results.map((result) => {
		if (isFullPageOrDatabase(result)) {
			const nameProps = result.properties['Name'];
			const dateProps = result.properties['Completed Date'];
			const doneProps = result.properties['Done'];
			const updatedByProps = result.properties['Updated by'];
			const updated =
				updatedByProps.type === 'rich_text' &&
				updatedByProps.rich_text instanceof Array &&
				updatedByProps.rich_text[0];

			return {
				id: result.id,
				name:
					nameProps.type === 'title' && nameProps.title instanceof Array
						? nameProps.title[0].plain_text
						: '',
				date: dateProps.type === 'date' ? dateProps.date?.start : null,
				completed: doneProps.type === 'checkbox' && doneProps.checkbox ? true : false,
				updatedBy: updated ? updated.plain_text : '',
			};
		}
	});

	// * Include pagination in the result
	return {
		result: result,
		pagination: {
			has_more: dbContent.has_more,
			next_cursor: dbContent.next_cursor,
		},
	};
};

/**
 * * Update a notion schedule page within the schedules database
 * @param dbId notion database id to update
 * @param pageId page id that is being updated
 */
const updateSchedule = async (dbId: string, pageId: string, name: string) => {
	try {
		const updatedPage = await notion.pages.update({
			page_id: pageId,
			properties: {
				'Completed Date': {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					date: {
						start: moment().add(7, 'hours').toDate(),
						time_zone: 'Asia/Bangkok',
					},
				},
				Done: {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					checkbox: true,
				},
				'Updated by': {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					rich_text: [
						{
							type: 'text',
							text: {
								content: name,
							},
						},
					],
				},
			},
		});
		console.info('Updaed page:', updatedPage);
		const nameProps = isFullPageOrDatabase(updatedPage) ? updatedPage.properties['Name'] : null;

		// * Emit a "scheduleUpdated", so it can be handled asynchronously later
		eventEmitter.emit('scheduleUpdated', {
			dbId,
			name:
				nameProps !== null && nameProps.type === 'title' && nameProps.title instanceof Array
					? nameProps.title[0].plain_text
					: '',
		});
	} catch (err) {
		console.log('Update schedule err:', err);
	}
};

/**
 * * Get a list of authorized user's name and email from notion database
 * @param dbId authorized users database in notion
 * @returns an object with user's name and email
 */
const getAuthUsers = async (dbId: string) => {
	const userDb = await notion.databases.query({
		database_id: dbId,
		filter: {
			property: 'Status',
			select: {
				equals: 'Active',
			},
		},
	});

	// * Making result more readable
	const result = userDb.results.map((result) => {
		if (isFullPageOrDatabase(result)) {
			const nameProps = result.properties['Name'];
			const emailProps = result.properties['Gmail'];

			return {
				name:
					nameProps.type === 'title' && nameProps.title instanceof Array
						? nameProps.title[0].plain_text
						: 'none',
				email:
					emailProps.type === 'email' && typeof emailProps.email === 'string'
						? emailProps.email
						: 'none',
			};
		}
	});

	return { users: result };
};

/**
 * * Event handler for "scheduleUpdated" event
 * * Used to create a new record similar to the one, which just got updated
 */
eventEmitter.on('scheduleUpdated', async (e: { dbId: string; name: string }) => {
	const newPage = await notion.pages.create({
		parent: {
			database_id: e.dbId,
		},
		properties: {
			Name: {
				title: [
					{
						text: {
							content: e.name,
						},
					},
				],
			},
		},
	});
	const dbName = databases.find((db) => db.id === e.dbId)?.label;
	const message = `🎉🎉🎉 Congratulation, ${e.name} has completed ${dbName}. Please view the 🗓️ schedule below:`;
	const option = encodeURIComponent(
		JSON.stringify({
			inline_keyboard: [
				[{ text: `${dbName} schedule`, url: `${envPub.PUBLIC_BASE_URL}?db=${e.dbId}` }],
			],
		})
	);
	await sendMessage(message, option);

	console.info(`New page created id=${newPage.id}`);
});

export { oAuthClient, getChoreSchedules, updateSchedule, getAuthUsers };
