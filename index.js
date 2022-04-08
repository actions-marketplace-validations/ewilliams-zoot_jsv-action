const core = require('@actions/core');
const fs = require('fs/promises');
const Ajv = require('ajv');
const promisify = require('util').promisify;


const promiseJsonParse = promisify(JSON.parse);


async function run() {
    try {
        const keyAndFile = core.getInput('key-and-file');
        const keyAndSchema = core.getInput('key-and-schema');

        const keyFiles = keyAndFile.split(' ');
        const keySchemas = keyAndSchema.split(' ');
        if (keyFiles.length !== keySchemas.length || keyFiles.length === 0) {
            throw Error("File list and schema list need to be the same length and greater than zero");
        }

        const fileSchemaMap = new Map();

        // Populates map with objects that will look like this
        // { file: "/src/file.json", schema: "/src/schemas/schema1.json"}
        // This is designed to support users adding files and keys in any order
        // in the yaml definition.
        for (let i = 0; i < keyFiles.length; ++i) {
            const keyFilePair = keyFiles[i].split(":");// ["f1", "/src/file.json"]
            const keySchemaPair = keySchemas[i].split(":");// ["f1", "/src/schemas/schema1.json"]

            if (fileSchemaMap.has(keyFilePair[0])) {
                fileSchemaMap.get(keyFilePair[0])["file"] = keyFilePair[1];
            } else {
                fileSchemaMap.set(keyFilePair[0], {});
            }

            if (fileSchemaMap.has(keySchemaPair[0])) {
                fileSchemaMap.get(keySchemaPair[0])["schema"] = keySchemaPair[1];
            } else {
                fileSchemaMap.set(keySchemaPair[0], {});
            }
        }

        const validateResultPromises = [];
        fileSchemaMap.forEach((config) => {
            validateResultPromises.push(validateSchema(config));
        });

        const validateResults = await Promise.all(validateResultPromises);
        const valids = validateResults.filter((isValid) => isValid);

        if (valids.length < validateResults) {
            core.warning("Some of your JSON files are not valid against the schema used");
            return;
        }

        core.info("All JSON files were valid against schemas");

    } catch (e) {
        core.error(`Failed build: ${e}`);
    }
}

run();


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

        const parsedResults = await Promise.all([
            promiseJsonParse(readResults[0]),// file
            promiseJsonParse(readResults[1])// JSON schema
        ]);

        const ajv = new Ajv();
        const validate = ajv.compile(parsedResults[1]);

        const isValid = validate(parsedResults[0]);
        return isValid;

    } catch (e) {
        throw Error(`Could not read file-schema pair: '${fileSchemaConfig.file}', '${fileSchemaConfig.schema}'\n${e.message}`);
    }
}

