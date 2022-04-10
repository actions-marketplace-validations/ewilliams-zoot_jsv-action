const { validateSchema, createConfigMap } = require('../src/helpers.js');


const fileStr = [`test:${__dirname}/resources/test_file.json`, `test:${__dirname}/resources/test_file_2.json`];
const schemaStr = [`test:${__dirname}/resources/test_schema.json`];

const map = createConfigMap(fileStr, schemaStr);


validateSchema(map.get("test"))
    .then((isValid) => console.log(isValid))
    .catch((e) => console.log(`Error validating: ${e}`));