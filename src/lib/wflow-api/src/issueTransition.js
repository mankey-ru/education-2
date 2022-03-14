import axios from 'axios';

/**
 * Смена статуса ишью
 * @param {obj} param0
 * @param {number} param0.baseUrl строка в формате протокол + домен + порт (опц.)
 * @param {number} param0.issueId ID ишью
 * @param {number} param0.statusId новый статус
 * @param {object} param0.axiosInstance инстанс axios
 * @returns armRecord
 */
export async function issueTransition({ baseUrl, issueId, statusId, axiosInstance }) {
	if (!baseUrl) throw `no baseUrl provided`;
	if (!issueId) throw `no issueId provided`;
	if (!statusId) throw `no statusId provided`;
	if (!axiosInstance) console.error('Внимание! Используется дефолтный инстанс axios!');
	const axiosInst = axiosInstance || axios;

	const res = await axiosInst({
		method: 'post',
		url: `${baseUrl}/api/v1/issue/transition?id=${issueId}&status_id=${statusId}`,
	});

	const issueData = res.data?.records?.[0];
	if (!issueData) throw `Issue status transition error. ${JSON.stringify(res.data)}`;

	return issueData;
}
