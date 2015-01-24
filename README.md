# SIS Framework - AngularJS
Javascript Framework for module discovery and orchestration.

## Installation Instructions

```bash
npm install
npm install -g bower
bower install
npm install -g grunt-cli
```

## Build Instructions
```bash
grunt concat:dist
grunt uglify:dist
```

or

```bash
grunt
```

## Running Tests
To be added.

## Documentation
This is an AngularJS framework and will be a bower private package which can be installed on each of the applications that require to use modules.

The main role of the framework is to orchestrate the interaction between modules and add the modules on the page. The modules need to be as loosely coupled as possible, so they will interact between themselves using an events component provided by the framework.

![Framework Diagram](https://cloud.githubusercontent.com/assets/585066/5886953/aa0ca136-a3bf-11e4-8453-d16d87af2c7e.png)

The framework is divided into two submodules:

- [sis.modules](https://github.com/sustainableis/javascript-framework/wiki/sis.modules)
- [sis.api](https://github.com/sustainableis/javascript-framework/wiki/sis.api)
