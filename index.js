const core = require('@actions/core');
const { validateSchema, createConfigMap } = require('./src/helpers.js');


async function run() {
    try {
        core.info(`Current directory: ${__dirname}`);
        
        const keyAndFile = core.getInput('key-and-file');
        const keyAndSchema = core.getInput('key-and-schema');

        const keyFiles = keyAndFile.split(' ');
        const keySchemas = keyAndSchema.split(' ');
        if (keyFiles.length !== keySchemas.length || keyFiles.length === 0) {
            throw Error("File list and schema list need to be the same length and greater than zero");
        }

        const fileSchemaMap = createConfigMap(keyFiles, keySchemas);

        const validateResultPromises = [];
        fileSchemaMap.forEach((config) => {
            validateResultPromises.push(validateSchema(config));
        });

        const validateResults = await Promise.all(validateResultPromises);
        const valids = validateResults.filter((isValid) => isValid);

        if (valids.length < validateResults.length) {
            core.warning("Some of your JSON files are not valid against the schema used");
            return;
        }

        core.info("All JSON files were valid against schemas");

    } catch (e) {
        core.error(`Failed build: ${e}`);
    }
}

run();



