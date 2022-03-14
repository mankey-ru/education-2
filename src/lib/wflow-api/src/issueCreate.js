import axios from 'axios';
import FormData from 'form-data';
import { transformRecords } from './../../uarm-api/index.js';

/**
 * Создание ишью
 * @param {object} param0
 * @param {string} param0.baseUrl строка в формате протокол + домен + порт (опц.), например, "https://cwp.oooinex.ru" или "http://uarm-service:20000"
 * @param {number} param0.processId
 * @param {object} param0.issueData
 * @param {string} param0.issueData.name
 * @param {number} param0.issueData.issue_type_id
 * @param {number} param0.issueData.status_id
 * @param {object} param0.axiosInstance инстанс axios
 * @returns armRecord
 */
export async function issueCreate({ baseUrl, processId, issueData, axiosInstance }) {
	if (!baseUrl) throw `baseUrl is missing`;
	if (!processId) throw `processId is missing`;
	if (!issueData) throw `issueData is missing`;
	if (!issueData.name) throw `issueData.name is missing`;
	if (!issueData.issue_type_id) throw `issueData.issue_type_id is missing`;
	if (!issueData.status_id) throw `issueData.status_id is missing`;
	if (!axiosInstance) console.error('Внимание! Используется дефолтный инстанс axios!');
	const axiosInst = axiosInstance || axios;

	const form = new FormData();
	const payloadObj = [
		{
			dataName: 'issue_data',
			isDeleteOperation: false,
			fields: transformRecords({ recordData: issueData }).recordsArray[0].fields,
		},
	];
	// console.log(payloadObj[0].fields);
	form.append('jsonPayload', JSON.stringify(payloadObj));

	const res = await axiosInst({
		method: 'post',
		url: `${baseUrl}/api/v1/issue/create?process_id=${processId}`,
		data: form,
		headers: form.getHeaders(),
	});

	const createdIssue = res?.data?.records?.[0];
	if (!createdIssue) throw `Issue not created. Response: ${JSON.stringify(res.data)}`;
	return createdIssue;
}
