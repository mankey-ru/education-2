import axios from 'axios';
import { getDoubleLogFn } from './../../logger/index.js'

const logPrefix = 'auth-ltpa';
const logError = getDoubleLogFn('error', logPrefix);
const logWarn = getDoubleLogFn('warn', logPrefix);

// TODO сделать CJS + ESM как написано здесь https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1#a013
// TODO обработка капчи, см. rzd/front/...../auth-handler-mobile.vue

/**
 * Аяксовая авторизация для вебсферы (не cwp)
 * @param {object} opt
 * @param {string} opt.username
 * @param {string} opt.pwd
 * @param {string} opt.captcha
 * @param {string} opt.baseUrl домен с протоколом без концевого слеша для запросов к /selfcare
 * @param {function} opt.logger функция, возвращающая инстанс логгера с методами error, warn, info, debug
 * @returns {string}
 */
export default async function login(opt) {
	const cookieName = opt.cookieName || 'LtpaToken2';

	// If value equals '0', certificate validation is disabled for TLS connections.
	// на проде и полигоне selfcare_base_url - это web.rzd, там ломаные сертификаты
	// т.е. у нас проблема не проявляется
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = String(0);
	// ещё моет быть флаг --tls-min-v1.0

	// обычно базовый УРЛ берем из БДК service.auth.selfcare_base_url
	const url = `${opt.baseUrl}/selfcare/j_security_check/json`;
	const postData = {
		j_username: opt.username,
		j_password: opt.pwd,
		// CAPTCHA ещё, TODO
	};

	//console.log(url);
	//console.log(postData);
	//console.log(new URLSearchParams(postData).toString());

	return new Promise((resolve, reject) => {
		axios({
			method: 'post',
			url,
			data: new URLSearchParams(postData).toString(),
			// maxRedirects + validateStatus
			// вот почему https://github.com/axios/axios/issues/953#issuecomment-308573328
			maxRedirects: 0,
			validateStatus: function (status) {
				return status >= 200 && status < 303;
			},
			headers: {
				Cookie: 'WASReqURL=https:///selfcare/successLogon/ru/json', // если ничего не передать, будет отправлена дефолтное значение и может случиться бага с протухшим токеном, описанная ниже
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			// withCredentials: true,
		})
			.then(({ headers, data }) => {
				const setCookieHeader = headers['set-cookie'];
				if (!setCookieHeader) {
					const signalPhrase = 'Доступ к внутренним ресурсам InEx';
					if (typeof data === 'string' && data.includes(signalPhrase)) {
						throw `ERROR: скрипт получает страницу "${signalPhrase}". Проверьте VPN и хосты, попробуйте открыть ${opt.baseUrl} в браузере`;
					} else throw `ERROR: в первом ответе сервера нет авторизационной куки`;
				}
				let cookie = setCookieHeader.find((c) => c.startsWith(`${cookieName}=`));

				if (cookie) {
					const token = cookie.split(';')[0].split('=')[1]; // по уму надо куку искать по имени, а не вот так вот
					axios.defaults.headers.common['Cookie'] = `${cookieName}=${token}`;
					// axios.defaults.withCredentials = true;
					// сейчас используется "глобальный" дефолтный заголовок (common - все типы запросов)
					// https://axios-http.com/docs/config_defaults
					// варианты слать с каждым запросом есть такие:
					// 1. кастомный инстанс axios (в uarmClient?) - требует переделки
					// 2. интерцептор использовался раньше и с ним был связан баг, когда при каждом логине токен получался свеий, но в последующий запрос уходил старый, полученный первым. Т.к. токен сферы протухает, это критично axios.interceptors.request.use((config) => {config.withCredentials = true;config.headers.common['Cookie'] = `${cookieName}=${token}`;return config; });
					// еще момент - токены не всегда выдаются уникальные. Если делать 35 попыток, на гамме стабильно их 2, на проде - 13. Видимо, по количеству нод или типа того. То бишь если токен после авторизации тот е, это не значит что модуль криво работает, как было с интерцепторами
					resolve(token);
				} else {
					logWarn('Auth response cookies:\n\n', setCookieHeader);
					let reason;
					if (data) {
						if (data.code) {
							reason = data;
							// code == 'LOGON_REQUIRED_WITH_CAPTCHA' || code == 'CAPTCHA_INVALID'
							logError(`Response data:\n\n`, data);
						}
						if (typeof data === 'string') {
							logError('Response text:\n\n', data.substring(0, 200));
						}
					}
					reject(reason || `COOKIE_NOT_FOUND`);
				}
			})
			.catch(reject);
	});
}
