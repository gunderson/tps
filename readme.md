# Tool Project Scaffold

This project scaffold is in three parts, and each is built using Gulp.

Front End

CMS

API

## Dependancies

Node.js, MongoDB and Ruby

* on OSX

````bash
# ruby comes installed
brew install nodejs
brew install mongodb
````

Start mongodb

````bash
nohup mongod --dbpath=/data/db --port 27017 &
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

### Add a new Page

The following script scaffolds a new page, creating a view, a template and a sass file named after the new page. It also adds the a sass include to the index.sass file.

````bash
$ npm run add-page
````

### Javascript
