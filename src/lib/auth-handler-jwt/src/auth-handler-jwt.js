import axios from 'axios';
//import { getDoubleLogFn } from './logger.js';

//const logPrefix = 'auth-jwt';
//const logError = getDoubleLogFn('error', logPrefix);

// TODO сделать CJS + ESM как написано здесь https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1#a013

// atlassian-login  password-atlassian
// в БДК МЦЦ леат в service.control-center.wflow_login   service.control-center.wflow_password
// URL wflow лежит в service.control-center.wflow_url

/**
 * Аяксовая авторизация для сервисов MWK (JWT)
 * @param {object} opt
 * @param {string} opt.username
 * @param {string} opt.pwd
 * @param {string} opt.captcha
 * @param {string} opt.baseUrl
 * @param {string} opt.cookieName имя куки в которую класть токен
 * @param {string} opt.axiosInstance инстанс axios. Если не передать, куки запишутся в дефолтный
 * @param {string} opt.debug флаг, если trueish, то логируем всё на свете
 * @param {function} opt.logger функция, возвращающая инстанс логгера с методами error, warn, info, debug
 * @returns {string}
 */
export default async function login(opt) {
	// process.env.NODE_TLS_REJECT_UNAUTHORIZED = String(1);

	const defaultCookieName = 'JWT';

	const axiosInst = opt.axiosInstance || axios;

	// customOpts - это наше кастомное поле в инстансе axios
	const customOpts = axiosInst.defaults._customOpts || {};
	const axiosInstTitle = customOpts.title || 'DEFAULT_INST';

	// имя куки берем либо переданное в аргументах явно, либо из инстанса axios, либо дефолтную
	const cookieName = opt.cookieName || customOpts.cookieName || defaultCookieName;

	if (!opt.username) throw `Не указано поле username`;
	if (!opt.pwd) throw `Не указано поле pwd`;
	if (!opt.baseUrl) throw `Не указано поле baseUrl`;
	if (!opt.axiosInstance)
		console.error(`Внимание! 
			axiosInstance не указан, а значит куки будут записаны в дефолтный инстанс, от этого могут быть коллизии`);

	// у настроек сервиса авторизации на наших ПТК есть особенность:
	// внутри сети докера путь - /signin/login/json, а снаружи к этому добавляется ещеи /auth
	// т.е. здесь мы пытаемся угадать pathPrefix по виду урла
	// если не будем угадывать, то надо будет просто явно передавать в опциях pathPrefix
	// можно ещё угадывать не через регулярку, а через https://nodejs.org/api/url.html наверное
	let pathPrefix;
	const endsWithPortRegex = /:\d+$/;
	if (opt.pathPrefix) pathPrefix = opt.pathPrefix;
	else pathPrefix = endsWithPortRegex.test(opt.baseUrl) ? `` : `/auth`;

	const url = `${opt.baseUrl}${pathPrefix}/signin/login/json`;

	debugLog(`URL авторизации`, url);
	debugLog(`Инстанс axios`, axiosInstTitle);

	const postData = {
		login: opt.username,
		password: opt.pwd,
	};

	return new Promise((resolve, reject) => {
		axios({
			method: 'post',
			url,
			data: postData,
			// maxRedirects + validateStatus
			// вот почему https://github.com/axios/axios/issues/953#issuecomment-308573328
			/* maxRedirects: 0,
					validateStatus: function (status) {
						return status >= 200 && status < 303;
					}, */
			/* headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					}, */
		})
			.then(({ data }) => {
				debugLog(`Ответ авторизации`, data);
				if (data.success) {
					const { token, user } = data;
					let defaultCookieHeader = `${cookieName}=${token}`;
					axiosInst.defaults.headers.common['Cookie'] = defaultCookieHeader;
					axiosInst.defaults.headers.common['x-auth-axios-instance'] = axiosInstTitle;
					debugLog(`Записываем в инстанс токен`, token);
					// возможно, поможет тупо axios.defaults.withCredentials = true;
					resolve(token);
				} else {
					//logError(data);
					if (typeof data === 'string' && data.includes('K8S_UNREACHABLE')) {
						reject('K8S_UNREACHABLE');
					} else {
						reject(data);
					}
					throw `THROW! JWT Auth Failed, ${JSON.stringify(data)}`;
				}
			})
			.catch((err) => {
				//logError(err);
				if (err?.response?.status === 404) {
					reject(
						`Урл авторизации ${err?.config?.url} ответил 404. Вероятная причина: упущен префикс пути /auth. Он не нужен при походе внутри сети докера/кубера (когда baseUrl с портом) и нужен - когда мы идём через веб. См. комментарий и код определения pathPrefix`
					);
				} else {
					reject(err);
				}
				// throw err;
			});
	});

	function debugLog() {
		if (opt.debug) console.log('---------- JWT-AUTH-DEBUG', ...arguments);
	}
}
