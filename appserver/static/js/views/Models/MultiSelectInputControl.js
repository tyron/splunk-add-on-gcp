/*global define*/
define([
    'underscore',
    'views/shared/controls/Control',
    'splunk.util'
], function (
    _,
    Control,
    splunkUtils
) {
    /**
     * Radio button Group
     *
     * @param {Object} options
     *                        {Object} model The model to operate on
     *                        {String} modelAttribute The attribute on the model to observe and update on selection
     *                        {Object} items An array of one-level deep data structures:
     *                                      label (textual display),
     *                                      value (value to store in model)
     */
    var DELIMITER = '::::';

    return Control.extend({
        className: 'control multiselect-input-control splunk-multidropdown splunk-chioce-input',
        // moduleId: module.id,
        initialize: function () {
            if (this.options.modelAttribute) {
                this.$el.attr('data-name', this.options.modelAttribute);
            }
            Control.prototype.initialize.call(this, this.options);
        },

        events: {
            'change input': function (e) {
                var self = this;
                var oldItems = _.map(this.options.items, function (item) {
                    return item.id;
                });
                _.each(e.val, function (item) {
                    if (oldItems.indexOf(item) < 0) {
                        self.options.items.push({id: item, text: item});
                    }
                });

                var strValue = splunkUtils.fieldListToString(e.val);
                this.setValue(strValue, false);
            }
        },

        render: function () {
            //this.$el.html(this.compiledTemplate({
            //    items: this.options.items
            //}));
            //this.$('.selectController').select2({
            //    placeholder: this.options.placeholder,
            //    formatNoMatches: function () {
            //        return 'No matches found';
            //    },
            //    value: this._value,
            //    dropdownCssClass: 'empty-results-allowed',
            //    separator: DELIMITER,
            //    // SPL-77050, this needs to be false for use inside popdowns/modals
            //    openOnEnter: false,
            //    createSearchChoice: function (term) {
            //        return {
            //            label: term,
            //            value: term
            //        }
            //    }
            //})
            //    .select2('val', splunkUtils.stringToFieldList(this._value || ''));
            this.$el.html(this.template);
            this.$('.selectController').select2({
                createSearchChoice: function (term, data) {
                    if ($(data).filter(function () {
                            return this.text.localeCompare(term) === 0;
                        }).length === 0) {
                        return {id: term, text: term};
                    }
                },
                openOnEnter: false,
                multiple: true,
                data: this.options.items || []
            }).select2('val', splunkUtils.stringToFieldList(this._value || ''));
            return this;
        },

        setItems: function (items, render) {
            render = render || true;
            items = _.map(items, function (item) {
                return {
                    id: item,
                    text: item
                }
            });
            this.options.items = items;
            render && this.render();
        },
        //setItems: function (items, render) {
        //    render = render || true;
        //    this.options.items = items;
        //    render && this.render();
        //},
        //remove: function () {
        //    this.$('.selectController').select2('close').select2('destroy');
        //    return Control.prototype.remove.apply(this, arguments);
        //},
        //events: {
        //    'change select': function (e) {
        //        var values = e.val || [];
        //        this.setValue(splunkUtils.fieldListToString(values), false);
        //    }
        //},
        template: '<input type="hidden" class="selectController" />'
        //template: [
        //    '<select multiple="multiple">',
        //    '<% _.each(items, function(item, index){ %>',
        //    '<option value="<%- item.value %>"><%- item.label %></option>',
        //    '<% }) %>',
        //    '</select>'
        //].join('')
    });
});
