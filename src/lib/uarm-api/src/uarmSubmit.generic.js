import transformRecordsGeneric from './transformRecords.generic.js';
import axios from 'axios';

export default async function (
	formDataClassArg,
	fileClassArg,
	{
		baseUrl = 'http://uarm-service:20000',
		siteId = 1, // общие и системные
		records,
		pathPrefix = '',
		axiosInstance,
	}
) {
	if (!axiosInstance) console.error('Внимание! Используется дефолтный инстанс axios!');
	const axiosInst = axiosInstance || axios;
	// console.log(`uarmSubmit.generic args = `, arguments);
	const form = new formDataClassArg();
	const transformedRecs = transformRecordsGeneric(fileClassArg, records);

	// Добавляем обычные и каскадные поля
	const jsonPayloadObj = {
		records: transformedRecs.recordsArray,
	};
	form.append('jsonPayload', JSON.stringify(jsonPayloadObj));

	// Добавляем файлы
	for (const formFieldName in transformedRecs.filesObj) {
		form.append(formFieldName, transformedRecs.filesObj[formFieldName]);
	}

	// обычно baseUrl достают из БДК (service.uarm.url) http://uarm-service:20000
	// внимание! если обращаться к сервису напрямую, path будет такой, как ниже
	// если идти через веб-сервер (локалхост без порта, или продуктивный сайт)
	// то path должен начинаться с /api (см. pathPrefix)
	const path = `${pathPrefix}/arm/${siteId}/multi/data`;

	const axiosRequestConfig = {
		method: 'post',
		url: `${baseUrl}${path}`,
		data: form,
		maxBodyLength: 80 * 1024 * 1024, // 80 MB, кажется это максимальный размер файла для uarm
		//maxContentLength: Infinity, --- это размер ответа
		//maxBodyLength: Infinity, --- это размер запроса
	};

	if (form.getHeaders) {
		// этот метод есть у нпм пакета form-data и отсутствует у браузерного window.FormData
		axiosRequestConfig.headers = form.getHeaders();
	}

	return axiosInst(axiosRequestConfig).catch((err) => {
		const uarmErrMsg = err && err.response && err.response.data && err.response.data.message; // без .? для браузера и фронта
		if (uarmErrMsg) {
			console.error('uarmErrMsg', uarmErrMsg);
			if (uarmErrMsg === `Couldn't make multi update: Index 0 out of bounds for length 0`) {
				console.error(`\n\nВероятно, запись не существует, поэтому обновление не проходит\n\n`);
			}
		}
		throw err;
	});
}

/*
Успешный ответ на каскадное создание:

	{                            
	records: [                 
		{                        
		mode: 'select-record', 
		armId: 6000,           
		primaryKeyValue: 2,    
		fields: [Array]        
		},                       
		{                        
		mode: 'select-record', 
		armId: 6002,           
		primaryKeyValue: 2,    
		fields: [Array]        
		},                       
		{                        
		mode: 'select-record', 
		armId: 6003,           
		primaryKeyValue: 14,   
		fields: [Array]        
		}                        
	],                         
	sqlTraces: []              
	} 

Если одно из звеньев цепочки неуспешно, то ответ будет:
	{
		timestamp: 1644509603496,
		status: 400,
		error: 'Bad Request',
		message: `здесь SQL например',
		path: '/arm/1/multi/data'
	}

*/
