
import FormData from 'form-data';
import { ReadStream } from 'fs';
//import getUarmSubmit from './src/getUarmSubmit.js';
//import getTransformRecords from './src/getTransformRecords.js';

import uarmSubmitGeneric from './src/uarmSubmit.generic.js';
import transformRecordsGeneric from './src/transformRecords.generic.js';

/**
 * 
 * 
 * Это точка входа ДЛЯ НОДЫ
 * ***********************************************************************************************************
 * у каждой функции с API-специфическими требованиями (например, в браузере есть FormData, а в ноде это пакет)
 * есть оригинальный код (generic), который принимает апи-специфичные вещи аргументом
 * и есть обертка с этим самым аргументом точнее даже две
 */
export default function() {
	return uarmSubmitGeneric(FormData, ReadStream, ...arguments);
}

export function transformRecords () {
	return transformRecordsGeneric(ReadStream, ...arguments);
}