// https://sematext.com/blog/node-js-error-handling/#toc-5-catch-all-unhandled-promise-rejections-11

export default function () {
	process.on('unhandledRejection', (err) => {
		console.log('error-handling: unhandledRejection!');
		console.error(err);
	});

	// не валим приложение, если случается исключение
	// TODO как-то определять ошибки программиста (см. isOperationalError)
	process.on('uncaughtException', (err) => {
		console.log('\n\n\nerror-handling: uncaughtException!');
		console.error(err);
		console.log('\n\n\n');
		// if (!isOperationalError(err)) process.exit(1)
	});

	console.log(`Error handling initialized`);
}
