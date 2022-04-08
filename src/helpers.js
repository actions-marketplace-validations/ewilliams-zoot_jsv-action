const fs = require('fs/promises');
const Ajv = require('ajv');
const promisify = require('util').promisify;

const promiseJsonParse = promisify(JSON.parse);


exports.createConfigMap = createConfigMap;
exports.validateSchema = validateSchema;


/**
 * 
 * @param {string[]} filesList 
 * @param {string[]} schemasList 
 * @returns {Map}
 */
 function createConfigMap(filesList, schemasList) {
    const fileSchemaMap = new Map();

    // Populates map with objects that will look like this
    // { file: "/src/file.json", schema: "/src/schemas/schema1.json"}
    // This is designed to support users adding files and keys in any order
    // in the yaml definition.
    for (let i = 0; i < filesList.length; ++i) {
        const keyFilePair = filesList[i].split(":");// ["f1", "/src/file.json"]
        const keySchemaPair = schemasList[i].split(":");// ["f1", "/src/schemas/schema1.json"]

        if (fileSchemaMap.has(keyFilePair[0])) {
            fileSchemaMap.get(keyFilePair[0])["file"] = keyFilePair[1];
        } else {
            fileSchemaMap.set(keyFilePair[0], { file: keyFilePair[1] });// initialize
        }

        if (fileSchemaMap.has(keySchemaPair[0])) {
            fileSchemaMap.get(keySchemaPair[0])["schema"] = keySchemaPair[1];
        } else {
            fileSchemaMap.set(keySchemaPair[0], { schema: keySchemaPair[1] });// initialize
        }
    }

    return fileSchemaMap;
}


/**
 * Validates a file-schema pair
 * @param {{ file: string, schema: string }} fileSchemaConfig 
 * @returns {Promise<bool>}
 */
async function validateSchema(fileSchemaConfig) {
    try {
        const readResults = await Promise.all([
            fs.readFile(fileSchemaConfig.file),
            fs.readFile(fileSchemaConfig.schema)
        ]);

        
        const fileObj = JSON.parse(readResults[0].toString());
        const schemaObj = JSON.parse(readResults[1].toString());

        const ajv = new Ajv();
        const validate = ajv.compile(schemaObj);

        const isValid = validate(fileObj);
        return isValid;

    } catch (e) {
        throw Error(`Could not read file-schema pair: '${fileSchemaConfig.file}', '${fileSchemaConfig.schema}'\n${e.message}`);
    }
}