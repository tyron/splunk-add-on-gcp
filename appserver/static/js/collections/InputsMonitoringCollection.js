/*global define*/
define([
    'app/collections/ProxyBase.Collection',
    'app/models/InputsMonitoring',
    'app/config/ContextMap'
], function (
    BaseCollection,
    InputsMonitoring,
    ContextMap
) {
    return BaseCollection.extend({
        url: [
            ContextMap.restRoot,
            ContextMap.inputs_monitoring
        ].join('/'),
        model: InputsMonitoring,
        initialize: function (attributes, options) {
            BaseCollection.prototype.initialize.call(this, attributes, options);
        }
    });
});
