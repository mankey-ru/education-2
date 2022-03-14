import axios from 'axios';

/**
 * Получение карточки ишью по айди или ключу
 * @param {object} param0
 * @param {object} param0.baseUrl строка в формате протокол + домен + порт (опц.)
 * @param {object} param0.issueKey ключ ишью
 * @param {object} param0.axiosInstance инстанс axios
 * @returns ucmIssueCard
 */
export async function issueGet({ baseUrl, issueKey, issueId, axiosInstance }) {
	if (!baseUrl) throw `baseUrl is missing`;
	if (!axiosInstance) console.error('Внимание! Используется дефолтный инстанс axios!');
	const axiosInst = axiosInstance || axios;

	let urlParam;
	if (issueKey) urlParam = `key=${issueKey}`;
	else if (issueId) urlParam = `issue_id=${issueId}`;
	else throw `both issueKey and issueId are missing`;
	// пример получения по айди https://pirs.wflow.wdev.oooinex.ru/api/v1/issue/get?id=221118
	// пример получения по ключу https://pirs.wflow.oooinex.ru/api/v1/issue/get?key=MCC-164

	return new Promise((resolve, reject) => {
		// Описание АПИ https://wiki.oooinex.ru/display/WFLOW/API+Gateway#APIGateway-Issue
		axiosInst({
			method: 'get',
			url: `${baseUrl}/api/v1/issue/get?${urlParam}`,
		})
			.then((res) => {
				const theIssue = res?.data?.ISSUE_CARD?.ISSUE?.[0];
				// console.log(theIssue);
				if (theIssue) resolve(theIssue);
				else reject(`Issue not found. ${JSON.stringify(res.data)}`);
			})
			.catch((err) => {
				reject(err);
				throw err;
			});
	});
}
