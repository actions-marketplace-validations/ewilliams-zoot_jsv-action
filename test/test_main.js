const { validateSchema, createConfigMap } = require('../src/helpers.js');


const fileStr = [`test:${__dirname}/resources/test_file.json`];
const schemaStr = [`test:${__dirname}/resources/test_schema.json`];

const map = createConfigMap(fileStr, schemaStr);
//console.log(map);


validateSchema(map.get("test"))
    .then((isValid) => console.log(isValid))
    .catch((e) => console.log(`Error validating: ${e}`));