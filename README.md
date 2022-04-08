# jsv-action

An Action that validates any JSON files in your project against JSON schemas that are also in your project.

This action currently doesn't support file globs; you must pair any JSON files against the schema you want to use for validation for each file.

You need to use the `actions/checkout` action so the validation code can read your JSON files.
<hr/>

## Inputs

### key-and-file

This input is a space-delimited string of keys and JSON files. The format is `key:file`, where the `key` is used to pair against the keys used in the `key-and-schema` input.

**Example**
```yml
- uses: ewilliams-zoot/jsv-action@v1
  with:
    key-and-file: 'user:files/json/user.json accounts:files/json/accounts.json'
```

### key-and-schema

This input takes in the same format as the `key-and-file` input but references the JSON schemas you want to use to validat the JSON files in the `key-and-file` list.

**Building on Example**
```yml
- uses: ewilliams-zoot/jsv-action@v1
  with:
    key-and-file: 'user:files/json/user.json accounts:files/json/accounts.json'
    key-and-schema: 'user:files/schemas/user_schema.json accounts:files/schemas/account_schema.json'
```
<hr/>

## Outputs

This action does not have any outputs.
<hr/>

### Full Example

Note: you do not have to have your keys in the same order in both lists. The keys are added to a hashmap, so the order doesn't matter.

```yml
name: Validate My JSON
on: [push]
jobs:
  validate-json-files:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ewilliams-zoot/jsv-action@v1
        with:
          key-and-file: 'users:users.json accounts:accounts.json'
          key-and-schema: 'users:user_schema.json accounts:account_schema.json'
```