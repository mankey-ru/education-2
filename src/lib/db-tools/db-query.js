import pg from 'pg';

/**
 * Выполнить произвольный запрос БД
 * @param {object} query объект Query
 * @param {string} query.text Текст запроса
 * @param {[any]} query.values Значения для подстановки параметров (опц) кот заменяют выраения типа $1::text
 * @param {boolean} query.oneVal хотим получить одно значение (одну колонку одной строки)
 * @param {[string]} объект Query
 * @param {object} credentials реквизиты доступа к БД
 * @param {string} credentials.host хост (домен без протокола и порта)
 * @param {string} credentials.port порт
 * @param {string} credentials.database имя БД
 * @param {string} credentials.user пользователь
 * @param {string} credentials.password пароль
 * @returns {string}
 */
export async function dbQueryLib({ text, values = [], oneVal = false }, credentials) {
	if (!credentials) throw `DBQ. DB credentials not received`;
	const pgClient = new pg.Client(credentials);

	const query = {
		text, // 'SELECT value FROM config.base_parameters WHERE path_name = $1::text',
		values,
		rowMode: 'array', // rowMode: 'array' - чтобы в ответе были только значения
	};

	try {
		await pgClient.connect();
	} catch (err) {
		console.error('DBQ. ERROR. Failed to connect', credentials);
		throw err;
	}

	let queryResult;

	await pgClient
		.query(query)
		.then((res) => {
			queryResult = oneVal ? res.rows?.[0]?.[0] : res.rows;
			console.log(
				`DBQ. Executed query «${text}». Params: ${values}. Result: ${JSON.stringify(queryResult)}`
			);
		})
		.catch((err) => {
			console.error(`DBQ. ERROR. Failed to execute query.
Query: ${text}
Params: ${values}
Error: ${err.stack}`);
			console.log(`DBQ. ERROR. Query: ${text}. Params: ${values}. Disconnect`)
			pgClient.end(); // Потому что ниже выбрасываем исключение
			throw err;
		})
		.then(() => {
			console.log(`DBQ. Executed query «${text}». Params: ${values}. Disconnect`)
			pgClient.end() // Отключаемся от бд, чтобы сессия не висела
		});

	return queryResult;
}
