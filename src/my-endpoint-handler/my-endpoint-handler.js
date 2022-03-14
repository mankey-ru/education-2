// описание библиотек здесь https://wiki.oooinex.ru/pages/viewpage.action?pageId=88769146
import login from './../lib/auth-handler-jwt/index.js';
import { axiosMcc } from './../axios-instances.js';

export default async function (req, res) {
	const { name } = req.query;
	if (name) {
		try {
			const mccBaseUrl = 'https://mcc.oooinex.ru';
			// авторизация на МЦЦ с индивидуальным отловом ошибки (для облегчения отладки)
			console.log(`Авторизуемся на МЦЦ`);
			const mccLoginArg = {
				username: 'atlassian-login',
				pwd: 'password-atlassian',
				baseUrl: mccBaseUrl,
				axiosInstance: axiosMcc,
			};

			try {
				await login(mccLoginArg);
			} catch (error) {
				console.error(`MCC auth error`, mccLoginArg);
				res.status(500).json({ error: 'MCC auth error' });
			}
			// идем авторизованные (кука авторизации прикопана в дефолтных заголовках запроса) в АРМ МЦЦ
			const versionGetUrl = `${mccBaseUrl}/api/arm/1/6000/data?name=${name}`;
			console.log(`Получаем данные версии по урлу ${versionGetUrl}`);
			const versionGetResponse = await axiosMcc.get(versionGetUrl);

			res.status(200).json({
				uarmResponse: versionGetResponse.data,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: 'Server error' });
		}
	} else {
		console.log(`Bad request`);
		res.status(400).json({ error: 'Bad request' });
	}
}
