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
const { validateSchema, createConfigMap } = require('./src/helpers.js');


async function run() {
    try {
        core.info(`Files and schemas will be relative to this directory: "${__dirname}"`);

        const keyAndFile = core.getInput('key-and-file');
        const keyAndSchema = core.getInput('key-and-schema');

        core.info(`File list specified: "${keyAndFile}"`);
        core.info(`Schema list specified: "${keyAndSchema}`);

        const keyFiles = keyAndFile.split(' ');
        const keySchemas = keyAndSchema.split(' ');

        if (keyFiles.length < keySchemas.length || keyFiles.length === 0 || keySchemas.length === 0) {
            throw Error("Your file list should be equal to or longer than your schema list");
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
        core.setFailed(`Failed build: ${e}`);
    }
}

run();



