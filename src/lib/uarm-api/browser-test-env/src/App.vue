<template>
	<div id="app">
		<input type="file" id="myFile" />
		<button @click.prevent="submitForm">Отправить</button>
		<pre v-html="reqResult"></pre>
	</div>
</template>

<script>
import uarmSubmit from './../../src/uarmSubmit.browser.js';

export default {
	name: 'App',
	data() {
		return {
			reqResult: null,
		};
	},
	components: {},
	methods: {
		submitForm: async function () {
			const myFile = document.getElementById('myFile').files[0];

			if (!myFile) {
				alert(`Выберите файл`);
				return;
			}

			const rand = Math.floor(Math.random() * 1e5);
			try {
				const axiosResponse = await uarmSubmit({
					records: [
						// версия
						{
							armId: 6000,
							recordData: {
								name: `версия ${rand}`,
							},
						},
						// багастори к версии
						{
							armId: 6002,
							recordData: {
								name: `багастори к версии ${rand}`,
								task: `ишью PIRS-2-${rand}`,
								contract: 'контракт ${rand}',
								version_id: {
									sourceRecordIndex: 0, // индекс записи (элемента records), из которой брать поле
									sourceFieldName: 'id', // имя поля этой записи (dbcolname в терминах метаданных UARM) поля, из которого брать значение
								},
								'CROSSFIELD__db.acl__ivi__version_issue2component__id__version_issue_id__component_id__id':
									[],
							},
						},
						// файл к багастори
						{
							armId: 6003,
							recordData: {
								type_id: 1,
								version_issue_id: {
									sourceRecordIndex: 1, // индекс записи (элемента records), из которой брать поле
									sourceFieldName: 'id', // имя поля этой записи (dbcolname в терминах метаданных UARM) поля, из которого брать значение
								},
								data_id: myFile,
							},
						},
					],
				});

				console.log(axiosResponse.data);
				this.$data.reqResult = axiosResponse.data;
			} catch (err) {
				this.$data.reqResult = `Ошибка в консоли`;
				console.log(err);
			}
		},
	},
	created: async function () {},
};
</script>

<style>
#app {
	width: 1200px;
	margin: 60px auto;
	font-family: Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #2c3e50;
}
</style>
