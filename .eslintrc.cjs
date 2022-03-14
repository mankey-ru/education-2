// Чтобы конфиг работал, нужно
// - поставить расширение (напримре, для VSCode)
// - поставить пакет eslint глобально (npm i -g eslint) или локально (npm i -D eslint)

// Если писать в этот файл ошибочные настройки глобально (не внутри overrides, которые относятся к файлам),
// то после рестарта VSCode проверки перестают работать везде,
// то есть конструкции типа myUndefVar = 1; не будут приводить к красному подчеркиванию
// Если же писать неправильное внутри overrides, проверки перестают работать для указанных в files типах файлов.
// То бишь это более безопасно

module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 13,
		sourceType: 'module',
	},
	rules: {
		'no-unused-vars': 'off',
	},
	overrides: [
		{
			// вместо установки eslint-plugin-jest который весит 79мб (сам eslint - 8) имеем вот этот простой оверрайд
			// глобально поставить и eslint и eslint-plugin-jest не вышло - что-то не подхватывается
			files: ['**/*.test.js'],
			globals: {
				describe: 'readonly',
				test: 'readonly',
				expect: 'readonly',
			},
		},
	],
};
