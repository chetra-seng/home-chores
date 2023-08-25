import { env } from '$env/dynamic/private';
import { Client, isFullPageOrDatabase } from '@notionhq/client';
import { OAuth2Client } from 'google-auth-library';
import moment from 'moment';
import EventEmitter from 'events';

const eventEmitter = new EventEmitter();

const oAuthClient = new OAuth2Client(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	env.GOOGLE_REDIRECT_URL
);

const notion = new Client({
	auth: env.NOTION_CLIENT_SECRET,
});

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
				property: 'Created time',
				direction: 'ascending',
			},
		],
	});

	const result = dbContent.results.map((result) => {
		if (isFullPageOrDatabase(result)) {
			const nameProps = result.properties['Name'];
			const dateProps = result.properties['Completed Date'];
			const doneProps = result.properties['Done'];

			return {
				id: result.id,
				name:
					nameProps.type === 'title' && nameProps.title instanceof Array
						? nameProps.title[0].plain_text
						: '',
				date: dateProps.type === 'date' ? dateProps.date?.start : null,
				completed: doneProps.type === 'checkbox' && doneProps.checkbox ? true : false,
			};
		}
	});

	return {
		result: result,
		pagination: {
			has_more: dbContent.has_more,
			next_cursor: dbContent.next_cursor,
		},
	};
};

const updateSchedule = async (dbId: string, pageId: string) => {
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
			},
		});
		console.info('Updaed page:', updatedPage);
		const nameProps = isFullPageOrDatabase(updatedPage) ? updatedPage.properties['Name'] : null;
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

	console.info(`New page created id=${newPage.id}`);
});

export { oAuthClient, getChoreSchedules, updateSchedule, getAuthUsers };
