import winston from 'winston';
import winstonElastic from 'winston-elasticsearch';
// const { ElasticsearchTransport } = winstonElastic; CJS модуль, поэтому так
// todo логирование на локальном ПТК - не посылать в эластик и писать в консоль

// внимание! версии winston-elasticsearch и winston устаревшие,
// доки на winston-elasticsearch@0.5.9 пока не нашёл
// а всё потому что у нас эластик 5.6.5

// проверить попадание сообщения в индекс можно по ссылке
// https://kibana.oooinex.ru/app/kibana#/discover?_g=()&_a=(columns:!(_source),index:AX6QG1dDR4hhrEhu0uh0,interval:auto,query:(match_all:()),sort:!('@timestamp',desc))
// это работает разумеется только на наших серверах
// и без ВПН пишет No results found !

// посмотреть все индексы: http://172.22.2.12:9200/_cat/indices
// посмотреть текущий индекс http://172.22.2.12:9200/new_in_version-ivi-2022.01.25/ (дату выставить сегодня)
// маппинг http://172.22.2.12:9200/new_in_version-ivi-2022.01.25/log/_mapping
// TODO http://www.thedreaming.org/2020/06/24/structured-logging-nodejs/
// TODO https://codesandbox.io/examples/package/winston-elasticsearch

let loggerInstance; // рассчитываем, что логгер на приложение один

export default getLoggerInstance;

const doubleLogFnElasticDisabled = process.env.PTK_NAME === 'DEV_RUN';

export function initLogger(ifrName, appName, extraOpts = {}) {
	//const ifrName = 'new_in_version';
	//const appName = 'ivi';
	if (doubleLogFnElasticDisabled) return;

	// в докере этот адрес есть
	// а вот чтобы заработало локально, надо
	// прописать в хосты 172.22.2.12 elasticsearch.logging.svc.cluster.local
	const hostname = 'elasticsearch.logging.svc.cluster.local'; // это не из БДК, а зашивается в прилоение: эластик для логов
	const port = 9200;
	const host = extraOpts.host || `${hostname}:${port}`;

	const indexPrefix = `${ifrName}-${appName}`;

	const esTransportOpts = {
		// опции транспорта - см. здесь node_modules\winston-elasticsearch\index.js
		// а также здесь https://github.com/vanthome/winston-elasticsearch#options
		level: 'info', // минимальный уровень сообщений, которые будут отправлены в эластик: debug-info-warn-error (умолч. - инфо)
		indexPrefix,
		clientOpts: {
			// опции клиента эластика - см. здесь node_modules\elasticsearch\src\lib\client.js
			// внимание! клиент используется легаси - https://github.com/elastic/elasticsearch-js-legacy/tree/14.x
			log: [
				// это логирование клиента эластика, что у него там внутри происходит
				// типы (type) можно посмотреть в node_modules\elasticsearch\src\lib\loggers
				// уровни здесь могут быть: error, warning, info, debug, trace
				// смысл уровней логирования https://stackoverflow.com/a/2031209
				// по ходу, указанный тип применяется ко всем уровням выше
				// то есть если указать только варнинг, будут отобрааться только варнинг и эррор
				// если хочется выводить отправленные сообщения в консоль, надо поставить 'trace'
				// тип stdio поприятнее выглядит, зато тип console разворачивает JSON
				{
					type: 'stdio',
					level: 'warning',
				},
			],
			host,

			// hosts: [{ hostname, port }],
			// node: `http://${host}`, - современная версия
			// auth:{username: 'elastic',password: 'jmango360'}
		},
	};

	const esTransport = new winstonElastic(esTransportOpts);
	// const esTransport = new ElasticsearchTransport(esTransportOpts); - современная версия

	// const logger =  // createLogger({ - современная версия
	loggerInstance = new winston.Logger({
		transports: [esTransport],
	});

	// Compulsory error handling - это непонятно зачем. Из примера.
	loggerInstance.on('error', (error) => {
		console.error('Error in logger caught', error);
	});
	esTransport.on('error', (error) => {
		console.error('Error in logger transport caught', error);
	});

	console.log(
		`Logger initialized.`,
		`     ES host: ${host}.`,
		`     ES index name: ${loggerInstance.transports.elasticsearch.getIndexName(esTransportOpts)}.`
	);
}

export function getDoubleLogFn(level = 'error', prefix = '') {
	return function () {
		// Вывод в консоль. Префикс (имя приложения/модуля) выводится в строке в квадратных скобках
		if (prefix) console[level](`[${prefix}]`, ...arguments)
		else console[level](...arguments);

		// эластик на дев-запуске не нужен
		if (doubleLogFnElasticDisabled) return;

		// если в логгер передать объект, он будет разобран на поля в эластике, т.е. не попадет в message
		// поэтому делаем stringify
		const stringifiedArgs = Array.from(arguments).map((arg) => {
			let res = '#_NOT_CONVERTED_TO_STRING_#';
			if (typeof arg === 'string') {
				res = arg;
			} else {
				// Ошибки (instanceof срабатывает и на ReferenceError и на другие)
				// после stringify становятся {}
				const isError = arg instanceof Error;
				if (isError && arg.stack) {
					res = arg.stack;
				} else if (isError && arg.toString) {
					res = arg.toString();
				} else {
					// если не ошибки - пытаемся сделать stringify или на худой конец toString
					try {
						// трай-кетч - на случай например объектов с circular влоенностью
						res = JSON.stringify(arg);
					} catch (err) {
						const stringifyErr = 'getDoubleLogFn stringify object error';
						console.error(stringifyErr, arg, err);
						if (arg && arg.toString) res = arg.toString();
						getLoggerInstance().warn(stringifyErr, res, err);
					}
				}
			}
			return res;
		});
		getLoggerInstance()[level](...stringifiedArgs, {
			// добавляем объект который эластик разворачивает в fields
			ptkName: process.env.PTK_NAME,
			appName: prefix,
		});
	};
}

function getLoggerInstance() {
	return (
		loggerInstance || {
			// болванка с выбрасыванием ошибки, чтобы не забывали вызывать loggerInit()
			error: simpleLog,
			warn: simpleLog,
			info: simpleLog,
			debug: simpleLog,
		}
	);
}

let loggerInitWarningDone = false;
function simpleLog() {
	if (!loggerInitWarningDone) {
		console.error(
			`\n\n\n\n
		Нужно 
		- 1. хотя бы раз, например, в index.js, вызвать инициализацию
			import { initLogger } from './lib/logger/index.js'; // путь указать свой
			initLogger('new_in_version', 'ivi'); // аргументы - имя проекта/ифр и имя приложения
		- 2. не присваивать логгер константе в начале модуля (эндпоинта, например), а вызывать всегда из функции
			import logger from './lib/logger/index.js'; // путь указать свой
			logger().error('Something is wrong');
			
		\n\n\n\n`
		);
		loggerInitWarningDone = true;
	}
	console.log(...arguments);
}

/*

function ETO_TEST_getDoubleLogFn () {
	import { initLogger } from './lib/logger/index.js';
	initLogger('new_in_version', 'rvi');

	import { getDoubleLogFn } from './lib/logger/index.js';

	const logPrefix = 'MYPREFIX';
	const logError = getDoubleLogFn('error', logPrefix);

	const circular = { prop: 1 };
	circular.circProp = circular;

	logError('WWW', { ttt: 333 }, new Error('asd'), circular);


	console.log(11111111111111111);
}

function getIndexName() {
	return getLoggerInstance().transports.elasticsearch.getIndexName(esTransportOpts);
}

// способ искать сообщения
// ахтунг! клиент используется старый https://github.com/elastic/elasticsearch-js-legacy/tree/14.x
export function findMessage(q) {
	client
		.search({
			index: getIndexName(),
			type: 'log',
			q,
		})
		.then((resp) => {
			console.log(resp.hits.hits);
		})
		.catch((err) => {
			console.trace(err.message);
		});
}
*/
