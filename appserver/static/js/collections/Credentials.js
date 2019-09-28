/*global define*/
define([
    'app/collections/ProxyBase.Collection',
    'app/models/Credential',
    'app/config/ContextMap'
], function (
    BaseCollection,
    Credential,
    ContextMap
) {
    return BaseCollection.extend({
        url: [
            ContextMap.restRoot,
            ContextMap.credential
        ].join('/'),
        model: Credential,
        initialize: function (attributes, options) {
            BaseCollection.prototype.initialize.call(this, attributes, options);
        }
    });
});
