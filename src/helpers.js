/*
MIT License

Copyright (c) 2022 Ezekiel Williams

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
*/

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
            core.info(`Adding file to list: '${fileKey}' -> '${filePath}`);
            fileSchemaMap.get(fileKey).files.push(filePath);
        } else {
            core.info(`Starting new file list for key: '${fileKey}' -> '${filePath}`);
            const existingKeyObj = fileSchemaMap.get(fileKey);
            const objectToSet = existingKeyObj
                ? { ...existingKeyObj, files: [ filePath ]}
                : { files: [ filePath ]};
            fileSchemaMap.set(fileKey, objectToSet);// initialize
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
            core.info(`Setting the schema for existing key: '${schemaKey}' -> '${schemaPath}`);
            configObj.schema = schemaPath;

        } else {
            core.info(`Setting the schema for new key: '${schemaKey}' -> '${schemaPath}`);
            fileSchemaMap.set(schemaKey, { schema: schemaPath });// initialize
        }
    });

    console.info(`Config map result`, fileSchemaMap);
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
        fileSchemaConfig.files.forEach((filePath, i) => {
            console.info(`Attempting to read JSON file [${i}]: ${filePath}`);
            fileReadPromises.push(fs.readFile(filePath));
        });
        console.info(`Attempting to read schema file: ${fileSchemaConfig.schema}`);
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