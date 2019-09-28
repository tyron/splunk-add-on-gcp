/*global define,$*/
define([
    'underscore',
    'views/shared/controls/Control',
    'select2/select2'
], function (
    _,
    Control
) {
    return Control.extend({
        initialize: function (options) {
            // Auto height for textarea
            $.fn.autoHeight = function () {
                function autoHeight(elem) {
                    elem.style.height = 'auto';
                    elem.scrollTop = 0;
                    elem.style.height = elem.scrollHeight + 'px';
                }

                this.each(function () {
                    autoHeight(this);
                });
            };

            var defaults = {
                useSyntheticPlaceholder: false,
                placeholder: ''
            };
            _.defaults(this.options, defaults);
            Control.prototype.initialize.apply(this, arguments);
        },

        events: {
            'change textarea': function (e) {
                var textareaValue = this.$('textarea').val();
                textareaValue = textareaValue.replace(/^\s+/g, '');
                textareaValue = textareaValue.replace(/\s+$/g, '');
                this.setValue(textareaValue, false);
                this.updatePlaceholder();
                this.$('textarea').autoHeight();
            },
            'keyup textarea': function(e) {
                this.$('textarea').autoHeight();
            }
        },

        updatePlaceholder: function() {
            if (this.options.useSyntheticPlaceholder) {
                this.$('.placeholder')[this.$textarea.val() === '' ? 'show' : 'hide']();
            }
        },

        render: function () {
            if (!this.el.innerHTML) {
                var template = _.template(this.template, {
                        options: this.options,
                        value: (_.isUndefined(this._value) || _.isNull(this._value)) ? '' : this._value
                    });
                this.$el.html(template);
                this.$textarea = this.$('textarea');
            } else {
                this.$textarea.val(this._value);
            }
            this.updatePlaceholder();

            return this;
        },

        template: '<textarea type="text" placeholder="<%- options.placeholder %>"</textarea><% if (options.useSyntheticPlaceholder) { %><span class="placeholder"><%- options.placeholder %></span><% } %>'
    });
});
