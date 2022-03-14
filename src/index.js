import express from 'express';
import myEndpointHandler from './my-endpoint-handler/index.js';

const app = express();
const port = 3093;

// не валим приложение, если случается исключение
// TODO как-то определять ошибки программиста (см. isOperationalError)
process.on('uncaughtException', (err) => {
	console.log('\n\n\nerror-handling: uncaughtException!');
	console.error(err);
	console.log('\n\n\n');
});

console.log(`App started. Listening port ${port}`);

app.get('/my_endpoint', myEndpointHandler);

app.listen(port);
