import { Client } from 'node-scp'
import { getDoubleLogFn } from './../lib/logger/index.js';
import fs from 'fs'
const logPrefix = 'getFileFromFtp';
const logError = getDoubleLogFn('error', logPrefix);
const logInfo = getDoubleLogFn('info', logPrefix);


export default async function getFileFromFtp ({host, port, username, password, filePath, fileList, downloadDir}) {
	try {
		logInfo(`Enter login and password`);
		const client = await Client({
			host: host, // 'moon' / 172.22.2.51
			port: port, // 22
			username: username, //'inex'
			password: password, //'ghjuhfvvf'
			// filepath: filePath,
			// filelist: fileList,
			// privateKey: fs.readFileSync('./key.pem'),
			// passphrase: 'your key passphrase',
		})
		//logInfo(`Try to get list of dirs and files`);
		//const result = await client.list(filePath)
		//console.log(result)
		//const result2 = await client.stat('/server/path')
		//console.log(result2)
		logInfo(`Create download dir ${downloadDir}`)
		await fs.mkdir(downloadDir, { recursive: true }, (err) => {
			if (err) logInfo(`Dir ${downloadDir} exists`)
		});
		let filesDownloadedWithPath = []
		for (let fileName of fileList) {
			try {
				logInfo(`Download file ${filePath+fileName}`)
				await client.downloadFile(filePath+fileName, downloadDir+fileName)
				filesDownloadedWithPath.push(downloadDir+fileName)
			} catch (err) {
				onError(`Download file ${filePath+fileName} - failed:`, err.message);
			}
		}
		logInfo(`Close connection`)
		client.close() // remember to close connection after you finish
		return filesDownloadedWithPath
	} catch (err) {
		onError('Failed:', err);
		throw err;
		
	}
	function onError() {
		logError(...arguments);
	}
}
