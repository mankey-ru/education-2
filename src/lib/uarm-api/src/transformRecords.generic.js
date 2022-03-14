/**
 * Трансформация передаваемого uarm-api аргумента в формат серверной части uarm
 * @param {*} recordsArg - одиночный объект или массив объектов UarmClientRecord {armId, mode?, recordData }
 * @param {*} fileClassArg - класс или массив классов файлов, например ReadStream для ноды и File для браузера
 * @returns { recordsArray: [UarmServerRecord], filesObj: {[string]: ReadStream | File} }
 */
export default function (fileClassArg, recordsArg) {
	// console.log(`transformRecords.generic args = `, arguments);
	if (!Array.isArray(recordsArg)) recordsArg = [recordsArg];
	if (!Array.isArray(fileClassArg)) fileClassArg = [fileClassArg];
	if (fileClassArg.some((fc) => !fc)) {
		console.log(`arguments =   `, arguments);
		console.trace();
		throw `transformRecords error. Необходимо передавать "файловые" классы. Например, ReadStream для ноды и File для браузера`;
	}

	const filesObj = {};

	const recordsArray = recordsArg.map((rec, recIndex) => {
		const mode = rec.mode ? rec.mode.toLowerCase() : 'create';
		const isCreate = mode === 'create';
		const fields = [];
		let idValue;

		// Обычные поля
		for (let recFieldName in rec.recordData) {
			// fieldItem может быть как готовым значением для вставки в колонку/поле АРМ,
			// так и специальным объектом с сигнальными свойствами sourceFieldName и sourceRecordIndex
			// для каскадной вставки (например, мастер-записи и зависимой).
			// В этом случае значение берётся из ранее вставленной в рамках текущего запроса записи
			// sourceRecordIndex - это индекс этой записи в массиве records
			// sourceFieldName - это имя колонки, из которой надо извлечь значение
			const recFieldValue = rec.recordData[recFieldName];
			const isCascade =
				typeof recFieldValue === 'object' &&
				'sourceFieldName' in recFieldValue &&
				'sourceRecordIndex' in recFieldValue;

			const isCrossField = recFieldName.startsWith('CROSSFIELD__');
			const isNoColumnField = recFieldName.startsWith('_FIELD_WITHOUT_COLUMN'); // например, рассылка
			const isFile = fileClassArg.some((fc) => recFieldValue instanceof fc);

			// console.log(`- ${recFieldName}. isFile=${isFile}. isCrossField=${isCrossField}. isNoColumnField=${isNoColumnField}`);

			const uarmServerField = {
				fieldId: isCrossField || isNoColumnField ? recFieldName : recFieldName.toLowerCase(),
				// toLowerCase - потому что иначе  bad SQL grammar [...]; nested exception is org.postgresql.util.PSQLException: ERROR: column "INTERVIEW_ID" of relation "interview_stat" does not exist - колонка в кавычках (чтобы не случилось пересечения с ключевыми словами ПГ) становится регистрозависимой
				// с CROSSFIELD наоборот - это не имя колонки БД и сервер проверяет эту сигнальную подстроку регистрозависимо, поэтому такой вот костыль :(
			};

			// -------------------- Кейс 1. Передан файл
			// Заменяем файлы в массиве records на объекты { formField: formFieldName } которые понимает сервер
			// сам файл кладем объект с ключами formFieldName и значениями-файламит
			if (isFile) {
				// let rand = Math.floor(Math.random() * 1e3);
				// console.log(`      ${recFieldName} is FILE!`);
				let formFieldName = `${recIndex}__${recFieldName}`; // __${rand}`;
				filesObj[formFieldName] = recFieldValue;
				uarmServerField.value = {
					formField: formFieldName,
				};
			}
			// -------------------- Кейс 2. Каскадный апдейт (мастер-запись + зависимая запись)
			// Заменяем файлы в массиве records на объекты { formField: formFieldName } которые понимает сервер
			// сам файл кладем объект с ключами formFieldName и значениями-файламит
			else if (isCascade) {
				uarmServerField.linkedValue = {
					recordIndex: recFieldValue.sourceRecordIndex, // индекс записи (элемента records), из поля sourceFieldName которой брать значение
					fieldId: recFieldValue.sourceFieldName, // имя поля (dbcolname в терминах метаданных UARM) поля, из которого брать значение
				};
			}
			// -------------------- Кейс 3. Обычное поле с готовым значением, например строкой или массивом
			else {
				uarmServerField.value = recFieldValue;
			}

			// Если ПК не указан, берём поле ID/id
			if (recFieldName.toUpperCase() === 'ID' && !isCreate && !isCascade) {
				idValue = recFieldValue;
				// внимание! здесь странность.
				// если не передавать primaryKeyValue и передавать ID в recordData (fields в понимании сервера),
				// то есть:
				// 1) закомментировать idValue = recFieldValue; выше
				// 2) закомментировать проверку с throw `Необходимо указать в аргументе первичный ключ
				// то uarm пытается перед обновлением УДАЛИТЬ запись с таким айди
				// соответственно, ему мешают констрейнты, если перед этим была каскадная операция
				// и всё рушится. Это делает невозмоным трюк, когда создаем мастер запись, к ней дочерние и в конце,
				// когда понятно, что все запросы прошли успешно, апдейтом главной записи (айди получается через каскадный
				// механизм) подигаем рассылку
				// НО! предполоительно это не нуно - по итогу эксперимента кается что все идет одной транзакцией
				// то есть неуспех "в середине" не создает записей "в начале", а сиквенсы прокручиваются притом
			}

			fields.push(uarmServerField);
		}

		const uarmRecord = {
			mode,
			armId: rec.armId,
			fields,
		};

		// при апдейте или делите ПК можно передавать просто как айди,
		// т.е. mode: delete, records: {[id: 123]} приведет удалению записи с ID=123
		if (rec.primaryKeyValue) uarmRecord.primaryKeyValue = rec.primaryKeyValue;
		else if (idValue) uarmRecord.primaryKeyValue = idValue;
		else if (!isCreate)
			throw `Необходимо указать в аргументе первичный ключ: или primaryKeyValue или ID`;

		//console.log(`rec.primaryKeyValue=`, rec.primaryKeyValue);
		//console.log(`uarmRecord.primaryKeyValue=`, uarmRecord.primaryKeyValue);
		//console.log(uarmRecord);

		return uarmRecord;
	});

	return {
		recordsArray,
		filesObj,
	};
}
