const axios = require('axios');

const port = 3093; // по уму - импортить, чтобы 3093 не дублировалось в src и тут
const baseUrl = `http://localhost:${port}`;

// респонс axios описан здесь https://axios-http.com/docs/res_schema

describe('Тесты сервиса my-endpoint', () => {
	test('Тупо проверяем, что сервис нашел старую версию', async () => {
		const axiosRes = await axios.get(`${baseUrl}/my_endpoint?name=Snout`);
		expect(axiosRes.data?.uarmResponse?.records?.[0]?.primaryKeyValue).toEqual(1);
	});
	test('Проверяем, что при отсутствии параметра нейм сервис отдает 400', async () => {
		const axiosRes = await axios.get(`${baseUrl}/my_endpoint`, {
			validateStatus: () => true,
		});
		expect(axiosRes.status).toEqual(400);
	});
});
