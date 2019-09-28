/*global define*/
define([
    'app/collections/ProxyBase.Collection',
    'app/models/InputsBilling',
    'app/config/ContextMap'
], function (
    BaseCollection,
    InputsBilling,
    ContextMap
) {
    return BaseCollection.extend({
        url: [
            ContextMap.restRoot,
            ContextMap.inputs_billing
        ].join('/'),
        model: InputsBilling,
        initialize: function (attributes, options) {
            BaseCollection.prototype.initialize.call(this, attributes, options);
        }
    });
});
