/*global define*/
define([
    "jquery",
    "underscore",
    "backbone",
    "contrib/text!app/templates/Dialogs/DeleteDialog.html",
    "contrib/text!app/templates/Models/ErrorMsg.html"
], function (
    $,
    _,
    Backbone,
    DeleteInput,
    ErrorMsg
) {
    return Backbone.View.extend({
        template: _.template(DeleteInput),

        events: {
            "submit form": "delete"
        },

        initialize: function (options) {
            this.collection = options.collection;
            this.model = options.model;
            this.stateModel = options.stateModel;
            this.dispatcher = options.dispatcher;
            this.inUse = options.inUse;
            this.deleteTag = options.deleteTag;
        },

        render: function () {
            this.$el.html(this.template({
                inUse: this.inUse,
                name: this.model.entry.attributes.name,
                deleteTag: this.deleteTag
            }));

            var dlg = this;
            this.$("[role=dialog]").on('hidden.bs.modal', function () {
                dlg.undelegateEvents();
            });

            return this;
        },

        delete: function () {
            var url, collection, delete_url;
            collection = this.model.collection;
            if (!collection) {
                collection = this.collection;
            }
            url =  this.model._url === undefined ? collection._url : this.model._url;
            delete_url = [
                collection.proxyUrl,
                url,
                this.encodeUrl(this.model.entry.attributes.name)
            ].join("/") + '?output_mode=json';

            $.ajax({
                url: delete_url,
                type: 'DELETE'
            }).done(function () {
                this.collection.remove(this.model);

                if (this.collection.length > 0) {
                    _.each(this.collection.models, function (model) {
                        model.paging.set('total', model.paging.get('total') - 1);
                    }.bind(this));
                    this.collection.reset(this.collection.models);
                } else {
                    var offset = this.stateModel.get('offset'),
                        count = this.stateModel.get('count');
                    this.collection.paging.set('offset', (offset - count) < 0 ? 0 : (offset - count));
                    this.collection.paging.set('perPage', count);
                    this.collection.paging.set('total', offset);

                    _.each(this.collection.models, function (model) {
                        model.paging.set('offset', (offset - count) < 0 ? 0 : (offset - count));
                        model.paging.set('perPage', count);
                        model.paging.set('total', offset);
                    }.bind(this));

                    this.stateModel.set('offset', (offset - count) < 0 ? 0 : (offset - count));
                    this.collection.reset(null);
                }

                if (this.collection._url === undefined) {
                    this.dispatcher.trigger('delete-input');
                }
                this.$("[role=dialog]").modal('hide');
            }.bind(this)).fail(function (model) {
                var rsp = JSON.parse(model.responseText),
                    regx = /In handler[\s\S]+and output:\s+\'([\s\S]*)\'\.\s+See splunkd\.log for stderr output\./,
                    msg = String(rsp.messages[0].text),
                    matches = regx.exec(msg);
                if (this.$('.msg-text').length) {
                    this.$('.msg-text').text(matches[1]);
                } else {
                    this.$(".modal-body").prepend(_.template(ErrorMsg, {msg: matches === null ? msg : matches[1]}));
                }
            }.bind(this));
        },

        modal: function () {
            this.$("[role=dialog]").modal({backdrop: 'static', keyboard: false});
        },

        encodeUrl: function (str) {
            return encodeURIComponent(str).replace(/'/g, "%27").replace(/"/g, "%22");
        }
    });
});
