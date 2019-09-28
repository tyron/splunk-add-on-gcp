/*global define*/
define([
    'app/models/Base.Model',
    'app/config/ContextMap'
], function (
    BaseModel,
    ContextMap
) {
    return BaseModel.extend({
        url: [
            ContextMap.restRoot,
            ContextMap.inputs_pubsub
        ].join('/'),

        initialize: function (attributes, options) {
            BaseModel.prototype.initialize.call(this, attributes, options);
            options = options || {};
            this.collection = options.collection;
        }
    });
});
