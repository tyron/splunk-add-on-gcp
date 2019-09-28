/*global define*/
define([
    'underscore',
    'app/models/Base.Model',
    'app/config/ContextMap'
], function (
    _,
    BaseModel,
    ContextMap
) {
    return BaseModel.extend({
        url: [
            ContextMap.restRoot,
            ContextMap.credential
        ].join('/'),

        initialize: function (attributes, options) {
            BaseModel.prototype.initialize.call(this, attributes, options);
            options = options || {};
            this.collection = options.collection;
            this.addValidation('google_credentials', this.validJSON);
        },

        validJSON: function(attr) {
            var google_credentials = this.entry.content.get(attr);
            try {
                JSON.parse(google_credentials);
            } catch (e) {
                return _('Field "Google Service Account Credentials" is not valid JSON format').t();
            }
        }
    });
});
