/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'app/util/Util',
    'models/Base',
    'views/shared/tablecaption/Master',
    'app/views/Component/Table',
    'app/views/Component/EntityDialog',
    'app/collections/Credentials',
    'app/collections/ProxyBase.Collection',
    'app/models/appData',
    'app/config/ComponentMap',
    'contrib/text!app/templates/Common/ButtonTemplate.html'
], function (
    $,
    _,
    Backbone,
    Util,
    BaseModel,
    CaptionView,
    Table,
    EntityDialog,
    Credentials,
    ProxyBase,
    appData,
    ComponentMap,
    ButtonTemplate
) {
    return Backbone.View.extend({
        initialize: function () {
            this.addonName = Util.getAddonName();
            //state model
            this.stateModel = new BaseModel();
            this.stateModel.set({
                sortKey: 'name',
                sortDirection: 'asc',
                count: 100,
                offset: 0,
                fetching: true
            });

            //Load service inputs
            this.services = ComponentMap.input.services;
            var service, Collection;
            for (service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    Collection = this.services[service].collection;

                    this[service] = new Collection([], {
                        appData: {app: appData.get("app"), owner: appData.get("owner")},
                        targetApp: this.addonName,
                        targetOwner: "nobody"
                    });
                }
            }

            //credentials collection
            this.credentials = new Credentials([], {
                appData: {app: appData.get("app"), owner: appData.get("owner")},
                targetApp: this.addonName,
                targetOwner: "nobody"
            });

            //Change search, sort
            this.listenTo(this.stateModel, 'change:search change:sortDirection change:sortKey', _.debounce(function () {
                this.fetchListCollection(this.credentials, this.stateModel);
            }.bind(this), 0));

            this.deferred = this.fetchAllCollection();
        },

        render: function () {
            var add_button_data = {
                    buttonId: "addCredentialBtn",
                    buttonValue: "Add Credential"
                },
                credential_deferred = this.fetchListCollection(this.credentials, this.stateModel);

            credential_deferred.done(function () {
                var description_html = "";

                //Caption
                this.caption = new CaptionView({
                    countLabel: _('Credentials').t(),
                    model: {
                        state: this.stateModel
                    },
                    collection: this.credentials,
                    noFilterButtons: true,
                    filterKey: ['name']
                });

                //Create view
                this.credential_list = new Table({
                    stateModel: this.stateModel,
                    collection: this.credentials,
                    refCollection: this.combineCollection(),
                    showActions: true,
                    enableMoreInfo: false,
                    component: ComponentMap.credential
                });
                this.$el.append($(description_html));
                this.$el.append(this.caption.render().$el);
                this.$el.append(this.credential_list.render().$el);
                $('#google-credentials-tab .table-caption-inner').prepend($(_.template(ButtonTemplate, add_button_data)));

                $('#addCredentialBtn').on('click', function () {
                    var dlg = new EntityDialog({
                        el: $(".dialog-placeholder"),
                        collection: this.credentials,
                        component: ComponentMap.credential,
                        isInput: false
                    }).render();
                    dlg.modal();
                }.bind(this));
            }.bind(this));
            return this;
        },

        fetchListCollection: function (collection, stateModel) {
            var search = '';
            if (stateModel.get('search')) {
                search = stateModel.get('search');
            }

            stateModel.set('fetching', true);
            return collection.fetch({
                data: {
                    sort_dir: stateModel.get('sortDirection'),
                    sort_key: stateModel.get('sortKey').split(','),
                    search: search,
                    count: stateModel.get('count'),
                    offset: stateModel.get('offset')
                },
                success: function () {
                    stateModel.set('fetching', false);
                }.bind(this)
            });
        },

        fetchAllCollection: function () {
            var singleStateModel = new BaseModel(),
                calls = [],
                service;
            singleStateModel.set({
                sortKey: 'name',
                sortDirection: 'asc',
                count: 100,
                offset: 0,
                fetching: true
            });

            for (service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    calls.push(this.fetchListCollection(this[service], singleStateModel));
                }
            }

            return $.when.apply(this, calls);
        },

        combineCollection: function () {
            var temp_collection = new ProxyBase([], {
                    appData: {app: appData.get("app"), owner: appData.get("owner")},
                    targetApp: this.addonName,
                    targetOwner: "nobody"
                }),
                service;

            for (service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    temp_collection.add(this[service].models, {silent: true});
                }
            }

            return temp_collection;
        }
    });
});
