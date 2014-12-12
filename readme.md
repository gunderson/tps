# Tool Project Scaffold

This project scaffold is in three parts, and each is built using Gulp.

Front End

CMS

API

## Dependancies

Node.js, mongodb and Ruby

* on OSX

````bash
# ruby comes installed
brew install nodejs
brew install mongodb
````

Start mongodb

````bash
nohup mongodb --dbpath=/data/db --port 27017
````

## Project Setup

Presumed installed: 

* Requires SASS gem

````bash
sudo gem install sass
````
* Requires Gulp

````bash
npm install -g gulp
````
* Install

````bash
npm install && gulp
````

## Development Process

Initialize

````bash
$ gulp
````

The system is set up with live reload for easy styling

Automatically compile your JADE, SASS and JS

````bash
$ gulp watch
````

### Javascript
