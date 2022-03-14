import pg from 'pg';

/**
 * 
 * @param {string|array} path_name строка или массив строк - ключ требуемого параметра в БДК
 * @param {object} credentials реквизиты доступа к БДК
 * @param {string} credentials.host хост (домен без протокола и порта)
 * @param {string} credentials.port порт
 * @param {string} credentials.database имя БД
 * @param {string} credentials.user пользователь
 * @param {string} credentials.password пароль
 * @returns {string}
 */
export default async function getBaseParameter(path_name, credentials) {
	if (!credentials) throw `GBP. DB credentials not received`;
	if (!Array.isArray(path_name)) path_name = [path_name]; // чтобы можно было передавать одну строку
	const client = new pg.Client(credentials);

	const query = {
		// Готовим sql-запрос, rowMode: 'array' - чтобы в ответе были только значения
		text: 'SELECT value FROM config.base_parameters WHERE path_name = $1::text',
		values: path_name,
		rowMode: 'array',
	};

	//await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // Для проверки асинхронности

	try {
		await client.connect()
	} catch (err) {
		console.error('GBP. ERROR. Failed to connect', path_name, credentials);
		throw err;
	}

	let parameterValue;

	await client
		.query(query)
		.then((res) => {
			parameterValue = res.rows[0].toString();
			console.log(`GBP. Executed query: ${path_name} = ${parameterValue}`);
		})
		.catch((e) => {
			// Не смогли выполнить sql-запрос
			console.log(`GBP. ERROR. Failed to execute query: ${e.stack}`);
		})
		.then(() => client.end()); // Отключаемся от бд, чтобы сессия не висела

	return parameterValue;
}
