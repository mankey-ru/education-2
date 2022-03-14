import axios from 'axios';

/**
 * Отвязать ишью
 * @param {obj} param0
 * @param {number} param0.baseUrl строка в формате протокол + домен + порт (опц.)
 * @param {number} param0.issueLinkId ID связи
 * @param {object} param0.axiosInstance инстанс axios
 * @returns number
 */
export async function issueUnbind({ baseUrl, issueLinkId, axiosInstance }) {
	if (!baseUrl) throw `no baseUrl provided`;
	if (!issueLinkId) throw `no issueLinkId provided`;
	if (!axiosInstance) console.error('Внимание! Используется дефолтный инстанс axios!');
	const axiosInst = axiosInstance || axios;

	const res = await axiosInst({
		method: 'post',
		url: `${baseUrl}/api/v1/issue/unbind?link_id=${issueLinkId}`,
	});

	/* res.data такая {
		records: [
			{
				mode: 'delete',
				armId: 36004,
				primaryKeyValue: 603852,
				fields: [Array],
			},
		],
		sqlTraces: [],
	}; */

	const removedIssueLinkId = res.data?.records?.[0]?.primaryKeyValue;
	if (!removedIssueLinkId) throw `Issue not unbound. ${JSON.stringify(res.data)}`;

	return removedIssueLinkId;
}
