# SIS Framework - AngularJS
Javascript Framework for module discovery and orchestration.

## Installation

```bash
npm install
npm install -g bower
bower install
npm install -g grunt-cli
```

## Build
```bash
grunt jshint:dist
grunt ngAnnotate:dist
grunt concat:dist
grunt uglify:dist
```

or

```bash
grunt
```

## Running Tests
To be added.

## Development
Include as bower package into an application.
* latest released version:
```javascript
{
    "dependencies": {
        "sis-framework": "git@github.com:sustainableis/javascript-framework.git"
    }
}
```
* latest commit on master:
```javascript
{
    "dependencies": {
        "sis-framework": "git@github.com:sustainableis/javascript-framework.git#master"
    }
}
```

## Documentation
The documentation for the framework is available on [wiki](https://github.com/sustainableis/javascript-framework/wiki/framework).
