require("backbone");

var Model = Backbone.Model.extend({
	dirty: false,
	connectionRequest: null,
	defaults: {
		values: null,
		x:0,
		y:0
	},
	initialize: function(){
		this.set("values", []);
	},
	setupCollection: function(){
		if (this.collection){
			this.listenTo(this.collection, "connection-request", this.onConnectionRequest);
			this.listenTo(this.collection, "connection-response", this.onConnectionResponse);
		}
	},
	// triggers
	triggerConnectionRequest: function(sourceId){
		this.destroyConnection(sourceId, true);
		this.trigger("connection-request", {
			model: this,
			sourceId: sourceId
		});
	},
	triggerConnectionResponseInput: function(inputId){
		//if source is an output
		if (this.connectionRequest && this.connectionRequest.sourceId.charAt(0) === "o"){
			//send connection resopnse
			this.setupConnection(inputId, this.connectionRequest.model)
		}
		// tell other components to cancel connection mode
		this.cancelConnectionRequest();
	},
	triggerConnectionResponseOutput: function(outputId){
		//if source is an output
		if (this.connectionRequest && this.connectionRequest.sourceId.charAt(0) === "i"){
			//send connection resopnse
			this.setupConnection(outputId, this.connectionRequest.model)
		}
		// tell other components to cancel connection mode
		this.cancelConnectionRequest();
	},
	cancelConnectionRequest: function(){
		this.trigger("connection-response");
	},

	//handlers
	onConnectionRequest: function(data){

		// ignore your own connection requests to prevent connecting to yourself
		if (_.findWhere(this.get("ports"), {id:data.sourceId})) {
			return;
		}

		// set connection mode by putting an object in the connectionRequest slot
		this.connectionRequest = data;
	},
	onConnectionResponse: function(){
		// cancel connection mode
		this.connectionRequest = null;
	},

	setupConnection: function(connectionId, partner){
		var connection = _.findWhere(this.get("ports"), {id: connectionId});
		_.extend(connection, {
			partner: partner
		});
		_.extend(partner, {
			partner: connection
		});
	},
	destroyConnection: function(partnerId, destroyPartnerConnection){
		_.each(this.get("ports"), function(connection){
			if (connection.partner && connection.partner.get("id") === partnerId){
				if (destroyPartnerConnection){
					connection.partner.destroyConnection(connection.get("id"), false);
				}
				connection.partner = null;
			}
		});
	}
});

module.exports = Model;