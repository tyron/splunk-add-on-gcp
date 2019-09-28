/*global define*/
define([
    'underscore',
    'jquery',
    'app/util/Util',
    'views/shared/PopTart',
    'app/views/Component/EntityDialog',
    'app/views/Component/Error',
    'app/collections/Credentials',
    'app/models/appData'
], function (
    _,
    $,
    Util,
    PopTartView,
    EntityDialog,
    ErrorDialog,
    Credentials,
    appData
) {
    return PopTartView.extend({
        className: 'dropdown-menu',
        initialize: function (options) {
            _.bindAll(this, 'create');
            PopTartView.prototype.initialize.apply(this, arguments);
            this.collection = options.collection;
            this.dispatcher = options.dispatcher;
            this.services = options.services;
            this.credentials = new Credentials([], {
                appData: {app: appData.get("app"), owner: appData.get("owner")},
                targetApp: Util.getAddonName(),
                targetOwner: "nobody"
            });
        },

        events: {
            'click a': 'create'
        },

        render: function () {
            var html = '<ul class="first-group">',
                service;
            for (service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    html += '<li><a href="#" class="' + service + '">' + this.services[service].title + '</a></li>';
                }
            }
            html += '</ul>';

            this.el.innerHTML = PopTartView.prototype.template_menu;
            this.$el.append(html);

            this.$el.addClass('dropdown-menu-narrow');
            return this;
        },

        create: function (e) {
            this.checkAccount().done(function () {
                var dlg, errorDialog;
                if (this.credentials.models.length === 0) {
                    errorDialog = new ErrorDialog({
                        el: $('.addonContainer'),
                        msg: 'Please create a Google credential first under configuration page.'
                    });
                    errorDialog.render().modal();
                } else {
                    this.service_type = $(e.target).attr('class');
                    dlg = new EntityDialog({
                        el: $(".dialog-placeholder"),
                        collection: this.collection,
                        component: this.services[this.service_type],
                        isInput: true
                    }).render();
                    dlg.modal();
                }
            }.bind(this));
            this.hide();
        },

        checkAccount: function () {
            return this.credentials.fetch();
        }
    });
});
