import axios from 'axios';

// _customOpts - это наш кастомный объект
export const axiosMcc = axios.create({
	_customOpts: {
		title: 'MCC_INST',
		cookieName: 'JWT',
	},
});
