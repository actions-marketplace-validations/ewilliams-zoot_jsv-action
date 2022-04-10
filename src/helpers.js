const core = require('@actions/core');
const fs = require('fs/promises');
const Ajv = require('ajv');

const promiseJsonParse = (jsonStr) => {
    return new Promise((res, rej) => {
        try {
        const obj = JSON.parse(jsonStr);
        res(obj);
        } catch (e) {
            rej(`Failed to parse JSON string: ${e}`);
        }
    });
};


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
    // { files: [ "/src/file.json" ], schema: "/src/schemas/schema1.json"}
    // This is designed to support users adding files and keys in any order
    // in the yaml definition.
    filesList.forEach((keyFile, i) => {
        const keyFilePair = keyFile.split(":");
        const fileKey = keyFilePair[0];
        const filePath = keyFilePair[1];

        if (fileSchemaMap.has(fileKey) && fileSchemaMap.get(fileKey).files) {
            fileSchemaMap.get(fileKey).files.push(filePath);
        } else {
            fileSchemaMap.set(fileKey, { files: [ filePath ] });// initialize
        }

        if (!schemasList[i]) return;

        const keySchemaPair = schemasList[i].split(":");// ["f1", "/src/schemas/schema1.json"]
        const schemaKey = keySchemaPair[0];
        const schemaPath = keySchemaPair[1];

        if (fileSchemaMap.has(schemaKey)) {
            /** @type {Object} */
            const configObj = fileSchemaMap.get(schemaKey);
            if (configObj.schema) {
                core.warning("You have two schemas with the same key; ignoring all but the first appearance in the list...");
                return;
            }
            configObj.schema = schemaPath;

        } else {
            fileSchemaMap.set(schemaKey, { schema: schemaPath });// initialize
        }
    });

    return fileSchemaMap;
}


/**
 * Validates a file-schema pair
 * @param {{ files: string[], schema: string }} fileSchemaConfig 
 * @returns {Promise<bool>}
 */
async function validateSchema(fileSchemaConfig) {
    try {
        const fileReadPromises = [];
        fileSchemaConfig.files.forEach((filePath) => {
            fileReadPromises.push(fs.readFile(filePath));
        });
        fileReadPromises.push(fs.readFile(fileSchemaConfig.schema));

        const readResults = await Promise.all(fileReadPromises);

        const parsePromises = [];
        readResults.forEach((result) => {
            parsePromises.push(promiseJsonParse(result.toString("utf-8")));
        });
        const parseResults = await Promise.all(parsePromises);

        const ajv = new Ajv();
        const validate = ajv.compile(parseResults[parseResults.length - 1]);

        let allValid = true;
        for (let i = 0; i < parseResults.length - 1; ++i) {
            if (!validate(parseResults[i])) allValid = false;
        }
        
        return allValid;

    } catch (e) {
        throw Error(`Could not read file-schema pair: ${e.message}`);
    }
}