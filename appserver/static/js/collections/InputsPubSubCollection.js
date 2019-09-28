/*global define*/
define([
    'app/collections/ProxyBase.Collection',
    'app/models/InputsPubSub',
    'app/config/ContextMap'
], function (
    BaseCollection,
    InputsPubSub,
    ContextMap
) {
    return BaseCollection.extend({
        url: [
            ContextMap.restRoot,
            ContextMap.inputs_pubsub
        ].join('/'),
        model: InputsPubSub,
        initialize: function (attributes, options) {
            BaseCollection.prototype.initialize.call(this, attributes, options);
        }
    });
});
