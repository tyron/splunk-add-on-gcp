/*global define,$*/
define([
    'views/shared/controls/Control'
], function (
    Control
) {
    return Control.extend({
        initialize: function (options) {
            Control.prototype.initialize.apply(this, arguments);
            this.displayText = options.displayText;
            this.helpLink = options.helpLink;
        },

        render: function () {
            this.$el.html(this.compiledTemplate({displayText: this.displayText, helpLink: this.helpLink}));
            return this;
        },

        template: '<div><%- displayText %><% if (helpLink) { %><a class=\"external\" target=\"_blank\" href=\"<%- helpLink %>\">Learn more</a><% } %></div>'
    });
});
