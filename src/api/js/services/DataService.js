var Backbone = require("Backbone");
var _ = require("underscore");

function DataService(){
	return this;
}

DataService.prototype = _.extend({}, Backbone.Events);

DataService.prototype.getData = function(){
	//check cache for data

	//if cached data is stale, getNewData
};

DataService.prototype.getNewData = function(){
	this.trigger("data", newData);
};

DataService.prototype.processNewData = function(){

};

DataService.prototype.saveNewData = function(){

};

DataService.prototype.sendData = function(res){
};

module.exports = DataService;