import axios from 'axios';

/**
 * Связать ишью ID=srcIssueId c ишью ID=dstIssueId типом связи linkTypeId (например, связь истории с версией/релизом)
 * @param {obj} param0
 * @param {number} param0.baseUrl строка в формате протокол + домен + порт (опц.)
 * @param {number} param0.srcIssueId ID ишью которое связываем (например, истории)
 * @param {number} param0.dstIssueId ID ишью, с которым связываем (например версии/релиза)
 * @param {number} param0.linkTypeId тип связи (например, если историю с релизом, то 5)
 * @param {object} param0.axiosInstance инстанс axios
 * @returns axiosResponse
 */
export async function issueBind({ baseUrl, srcIssueId, dstIssueId, linkTypeId, axiosInstance }) {
	if (!baseUrl) throw `no baseUrl provided`;
	if (!srcIssueId) throw `no srcIssueId provided`;
	if (!dstIssueId) throw `no dstIssueId provided`;
	if (!linkTypeId) throw `no linkTypeId provided`;
	if (!axiosInstance) console.error('Внимание! Используется дефолтный инстанс axios!');
	const axiosInst = axiosInstance || axios;

	const res = await axiosInst({
		method: 'post',
		url: `${baseUrl}/api/v1/issue/bind?src_issue_id=${srcIssueId}&dst_issue_id=${dstIssueId}&link_type_id=${linkTypeId}`,
	});

	// if (typeof res.data !== 'object') throw `WFLOW API wrong response type: ${res.data || res}`;

	/* res.data такая: {
		records: [
			{
				mode: 'select-record',
				armId: 36004,
				primaryKeyValue: 603848,
				fields: [Array],
			},
		],
		sqlTraces: [],
	}; */

	const issueLinkId = res.data?.records?.[0]?.primaryKeyValue;
	if (!issueLinkId) throw `Issue not bound. ${JSON.stringify(res.data)}`;

	return issueLinkId;
}
