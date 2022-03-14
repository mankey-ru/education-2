const axios = require('axios');

describe('Тесты сервиса my-endpoint', () => {
	test('Тупо проверяем, что сервис нашел старую версию', async () => {
		const axiosRes = await axios.get(`http://localhost:3093/my_endpoint?name=Snout`);
		expect(axiosRes.data?.uarmResponse?.records?.[0]?.primaryKeyValue).toEqual(1);
	});
});
