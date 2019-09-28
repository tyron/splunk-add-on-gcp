/*global require*/
define([
    'jquery',
    'underscore',
    'backbone',
    'app/util/Util',
    'app/collections/ProxyBase.Collection',
    'app/models/appData',
    'contrib/text!app/templates/Common/PageTitle.html',
    'models/Base',
    'views/shared/tablecaption/Master',
    'app/views/Component/InputFilterMenu',
    'app/views/Component/AddInputMenu',
    'app/views/Component/EntityDialog',
    'app/config/ComponentMap',
    'app/views/Component/Table'
], function (
    $,
    _,
    Backbone,
    Util,
    ProxyBase,
    appData,
    InputTitleTemplate,
    BaseModel,
    CaptionView,
    InputFilter,
    AddInputMenu,
    EntityDialog,
    ComponentMap,
    Table
) {
    return Backbone.View.extend({
        className: 'inputsContainer',
        initialize: function () {
            this.addonName = Util.getAddonName();
            //state model
            this.stateModel = new BaseModel();
            this.stateModel.set({
                sortKey: 'name',
                sortDirection: 'asc',
                count: 10,
                offset: 0,
                fetching: true
            });
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

            this.dispatcher = _.extend({}, Backbone.Events);

            //Change filter
            this.listenTo(this.dispatcher, 'filter-change', function (type) {
                this.filterChange(type, this.stateModel);
            }.bind(this));

            //Delete input
            this.listenTo(this.dispatcher, 'delete-input', function () {
                var all_deferred = this.fetchAllCollection();
                all_deferred.done(function () {
                    var temp_collection = this.combineCollection(),
                        offset = this.stateModel.get('offset'),
                        count = this.stateModel.get('count'),
                        models;
                    this.cached_inputs = temp_collection[0];
                    this.cached_search_inputs = temp_collection[1];

                    this.inputs.paging.set('offset', offset);
                    this.inputs.paging.set('perPage', count);
                    this.inputs.paging.set('total', this.cached_search_inputs.length);
                    models = this.cached_search_inputs.models.slice(offset, offset + count);
                    _.each(models, function (model) {
                        model.paging.set('offset', offset);
                        model.paging.set('perPage', count);
                        model.paging.set('total', this.cached_search_inputs.length);
                    }.bind(this));
                    this.inputs.reset(models);
                    this.inputs._url = undefined;
                }.bind(this));
            }.bind(this));

            //Add input with offset change
            this.listenTo(this.dispatcher, 'add-input', function () {
                var all_deferred = this.fetchAllCollection();
                all_deferred.done(function () {
                    var temp_collection = this.combineCollection(),
                        offset = this.stateModel.get('offset'),
                        count = this.stateModel.get('count'),
                        models;
                    this.cached_inputs = temp_collection[0];
                    this.cached_search_inputs = temp_collection[1];

                    this.inputs.paging.set('offset', offset);
                    this.inputs.paging.set('perPage', count);
                    this.inputs.paging.set('total', this.cached_search_inputs.length);
                    models = this.cached_search_inputs.models.slice(offset, offset + count);
                    _.each(models, function (model) {
                        model.paging.set('offset', offset);
                        model.paging.set('perPage', count);
                        model.paging.set('total', this.cached_search_inputs.length);
                    }.bind(this));
                    this.inputs.reset(models);
                    this.inputs._url = undefined;
                }.bind(this));
            }.bind(this));

            //Change sort
            this.listenTo(this.stateModel, 'change:sortDirection change:sortKey', _.debounce(function () {
                if (this.inputs._url === undefined) {
                    this.sortCollection(this.stateModel);
                } else {
                    var deferred = this.fetchListCollection(this.inputs, this.stateModel);
                    deferred.done(function () {
                        var offset = this.stateModel.get('offset'),
                            count = this.stateModel.get('count'),
                            total = this.inputs.models.length;
                        this.inputs.reset(this.inputs.models.slice(offset, offset+count));
                        this.inputs.paging.set('offset', offset);
                        this.inputs.paging.set('perPage', count);
                        this.inputs.paging.set('total', total);
                    }.bind(this));
                }
            }.bind(this), 0));

            //Change search
            this.listenTo(this.stateModel, 'change:search', _.debounce(function () {
                if (this.inputs._url === undefined) {
                    this.searchCollection(this.stateModel);
                } else {
                    var deferred = this.fetchListCollection(this.inputs, this.stateModel);
                    deferred.done(function () {
                        var offset = this.stateModel.get('offset'),
                            count = this.stateModel.get('count'),
                            total = this.inputs.models.length;
                        this.inputs.reset(this.inputs.models.slice(offset, offset+count));
                        this.inputs.paging.set('offset', offset);
                        this.inputs.paging.set('perPage', count);
                        this.inputs.paging.set('total', total);
                    }.bind(this));
                }
            }.bind(this), 0));

            //Change offset
            this.listenTo(this.stateModel, 'change:offset', _.debounce(function () {
                if (this.inputs._url === undefined) {
                    this.pageCollection(this.stateModel);
                } else {
                    var deferred = this.fetchListCollection(this.inputs, this.stateModel);
                    deferred.done(function () {
                        var offset = this.stateModel.get('offset'),
                            count = this.stateModel.get('count'),
                            total = this.inputs.models.length;
                        this.inputs.reset(this.inputs.models.slice(offset, offset+count));
                        this.inputs.paging.set('offset', offset);
                        this.inputs.paging.set('perPage', count);
                        this.inputs.paging.set('total', total);
                    }.bind(this));
                }
            }.bind(this), 0));

            this.deferred = this.fetchAllCollection();

            this.filter = new InputFilter({
                dispatcher: this.dispatcher,
                services: ComponentMap.input.services
            });

            this.emptySearchString = _.map(ComponentMap.input.filterKey, function(key) {
                return key + '=*';
            }).join(' OR ');
        },

        filterChange: function (type, stateModel) {
            // Do not triger the change event
            stateModel.set('offset', 0, {silent: true});
            var search = this.stateModel.get('search'),
                all_deferred,
                models,
                deferred;

            if (type === 'all') {
                if (search !== undefined && search !== this.emptySearchString) {
                    this.searchCollection(this.stateModel);
                    this.inputs._url = undefined;
                } else {
                    all_deferred = this.fetchAllCollection();
                    all_deferred.done(function () {
                        var temp_collection = this.combineCollection(),
                            offset = this.stateModel.get('offset'),
                            count = this.stateModel.get('count');
                        this.cached_inputs = temp_collection[0];
                        this.cached_search_inputs = temp_collection[1];
                        this.inputs.paging.set('offset', offset);
                        this.inputs.paging.set('perPage', count);
                        this.inputs.paging.set('total', this.cached_search_inputs.length);
                        models = this.cached_search_inputs.models.slice(offset, offset + count);
                        _.each(models, function (model) {
                            model.paging.set('offset', offset);
                            model.paging.set('perPage', count);
                            model.paging.set('total', this.cached_search_inputs.length);
                        }.bind(this));
                        this.inputs.reset(models);
                        this.inputs._url = undefined;
                    }.bind(this));
                }
            } else {
                deferred = this.fetchListCollection(this[type], this.stateModel);
                deferred.done(function () {
                    this.inputs.model = this.services[type].model;
                    this.inputs._url = this[type]._url;

                    var offset = this.stateModel.get('offset'),
                        count = this.stateModel.get('count');
                    this.inputs.reset(this[type].models.slice(offset, offset + count));
                    this.inputs.paging.set('offset', offset);
                    this.inputs.paging.set('perPage', count);
                    this.inputs.paging.set('total', this[type].paging.get('total'));
                }.bind(this));
            }
        },

        render: function () {
            var title_template, inputs_template_data, temp_collection;
            this.deferred.done(function () {
                this.stateModel.set('fetching', false);
                inputs_template_data = ComponentMap.input.caption;
                title_template = _.template(InputTitleTemplate);
                temp_collection = this.combineCollection();
                this.cached_inputs = temp_collection[0];
                this.cached_search_inputs = temp_collection[1];

                //Display the first page
                this.inputs = this.combineCollection()[0];
                this.inputs.models = this.cached_inputs.models.slice(0, this.stateModel.get('count'));

                if (this.inputs.length !== 0) {
                    _.each(this.inputs.models, function (model) {
                        model.paging.set('total', this.inputs.length);
                    }.bind(this));
                }

                this.inputs.paging.set('total', this.inputs.length);

                this.caption = new CaptionView({
                    countLabel: _('Inputs').t(),
                    model: {
                        state: this.stateModel
                    },
                    collection: this.inputs,
                    noFilterButtons: true,
                    filterKey: ComponentMap.input.filterKey
                });

                this.input_list = new Table({
                    stateModel: this.stateModel,
                    collection: this.inputs,
                    dispatcher: this.dispatcher,
                    enableBulkActions: false,
                    showActions: true,
                    enableMoreInfo: true,
                    component: ComponentMap.input
                });

                this.$el.append(title_template(inputs_template_data));
                this.$el.append(this.caption.render().$el);

                if (!ComponentMap.input.caption.singleInput && Object.keys(ComponentMap.input.services).length > 1) {
                    $('.table-caption-inner').append(this.filter.render().$el);
                }

                this.$el.append(this.input_list.render().$el);

                if (ComponentMap.input.caption.singleInput) {
                    var keys = Object.keys(ComponentMap.input.services);
                    if (keys.length === 1) {
                        $('#' + ComponentMap.input.caption.buttonId).on('click', function () {
                            var dlg = new EntityDialog({
                                el: $(".dialog-placeholder"),
                                collection: this.inputs,
                                component: ComponentMap.input.services[keys[0]],
                                isInput: true
                            }).render();
                            dlg.modal();
                        }.bind(this));
                    }
                } else {
                    $('#' + ComponentMap.input.caption.buttonId).on("click", function (e) {
                        var $target = $(e.currentTarget);
                        if (this.editmenu && this.editmenu.shown) {
                            this.editmenu.hide();
                            e.preventDefault();
                            return;
                        }

                        this.editmenu = new AddInputMenu({
                            collection: this.inputs,
                            dispatcher: this.dispatcher,
                            services: ComponentMap.input.services
                        });

                        $('body').append(this.editmenu.render().el);
                        this.editmenu.show($target);
                    }.bind(this));
                }
            }.bind(this));
        },

        fetchAllCollection: function () {
            var singleStateModel = new BaseModel(),
                calls = [],
                service;
            singleStateModel.set({
                sortKey: 'name',
                sortDirection: 'asc',
                count: 0,
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
            var temp_collection1 = new ProxyBase([], {
                    appData: {app: appData.get("app"), owner: appData.get("owner")},
                    targetApp: this.addonName,
                    targetOwner: "nobody"
                }),
                temp_collection2 = new ProxyBase([], {
                    appData: {app: appData.get("app"), owner: appData.get("owner")},
                    targetApp: this.addonName,
                    targetOwner: "nobody"
                }),
                service;

            for (service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    temp_collection1.add(this[service].models, {silent: true});
                    temp_collection2.add(this[service].models, {silent: true});
                }
            }

            return [temp_collection1, temp_collection2];
        },

        fetchListCollection: function (collection, stateModel) {
            var rawSearch = '', searchString = '';
            if (stateModel.get('search')) {
                searchString = stateModel.get('search');
                //make the filter work for field 'service' and 'status'
                rawSearch = searchString.substring(searchString.indexOf('*') + 1, searchString.indexOf('*', searchString.indexOf('*') + 1)).toLowerCase();
                if (this.serviceMap(collection._url) && this.serviceMap(collection._url).indexOf(rawSearch) > -1) {
                    searchString = this.emptySearchString;
                }

                if ("disabled".indexOf(rawSearch) > -1) {
                    searchString += ' OR (disabled="*1*")';
                }else if ("enabled".indexOf(rawSearch) > -1) {
                    searchString += ' OR (disabled="*0*")';
                }
            }

            stateModel.set('fetching', true);
            return collection.fetch({
                data: {
                    sort_dir: stateModel.get('sortDirection'),
                    sort_key: stateModel.get('sortKey'),
                    search: searchString,
                    count: 0,
                    offset: 0
                },
                success: function () {
                    stateModel.set('fetching', false);
                }.bind(this)
            });
        },

        searchCollection: function (stateModel) {
            var search = stateModel.get('search'),
                result = [],
                a = stateModel.get('search'),
                offset = this.stateModel.get('offset'),
                count = this.stateModel.get('count'),
                newPageStateModel = new BaseModel(),
                all_deferred,
                models,
                self = this,
                tmpArray = [],
                searchArray = [];

            if (search !== this.emptySearchString) {
                //Multiple search words
                if (a.split("OR")[0].indexOf("AND") > -1) {
                    tmpArray = a.split("OR")[0].split("AND");
                    _.each(tmpArray, function(item) {
                        searchArray.push(item.substring(item.indexOf('*') + 1, item.indexOf('*', item.indexOf('*') + 1)).toLowerCase());
                    });
                    _.each(this.cached_inputs.models, function (model) {
                        _.each(ComponentMap.input.filterKey, function (key) {
                            var hit = _.every(searchArray, function (search) {
                                return model.entry.get(key) && model.entry.get(key).toLowerCase().indexOf(search) > -1 ||
                                    model.entry.content.get(key) && model.entry.content.get(key).toLowerCase().indexOf(search) > -1 ||
                                    key === 'status' && self.statusMap(model.entry.content.get('disabled')).toLowerCase().indexOf(search) > -1 ||
                                    key === 'service' && self.serviceMap(model.id).toLowerCase().indexOf(search) > -1;
                            });
                            if (hit) {
                                result.push(model);
                            }
                        });
                    });
                } else {
                    search = a.substring(a.indexOf('*') + 1, a.indexOf('*', a.indexOf('*') + 1)).toLowerCase();
                    _.each(this.cached_inputs.models, function (model) {
                        _.each(ComponentMap.input.filterKey, function(key) {
                            if (model.entry.get(key) && model.entry.get(key).toLowerCase().indexOf(search) > -1 ||
                                model.entry.content.get(key) && model.entry.content.get(key).toLowerCase().indexOf(search) > -1 ||
                                key === 'status' && self.statusMap(model.entry.content.get('disabled')).toLowerCase().indexOf(search) > -1 ||
                                key === 'service' && self.serviceMap(model.id).toLowerCase().indexOf(search) > -1
                            ) {
                                result.push(model);
                            }
                        });
                    });
                }

                this.inputs.paging.set('offset', offset);
                this.inputs.paging.set('perPage', count);
                this.inputs.paging.set('total', result.length);
                _.each(result, function (model) {
                    model.paging.set('offset', offset);
                    model.paging.set('perPage', count);
                    model.paging.set('total', result.length);
                }.bind(this));
                this.cached_search_inputs.reset(result);

                newPageStateModel.set({
                    sortKey: 'name',
                    sortDirection: 'asc',
                    count: 10,
                    offset: 0,
                    fetching: true
                });

                this.pageCollection(newPageStateModel);

            } else {
                all_deferred = this.fetchAllCollection();
                all_deferred.done(function () {
                    var temp_collection = this.combineCollection();
                    this.cached_inputs = temp_collection[0];
                    this.cached_search_inputs = temp_collection[1];
                    this.inputs.paging.set('offset', offset);
                    this.inputs.paging.set('perPage', count);
                    this.inputs.paging.set('total', this.cached_search_inputs.length);
                    models = this.cached_search_inputs.models.slice(offset, offset + count);
                    _.each(models, function (model) {
                        model.paging.set('offset', offset);
                        model.paging.set('perPage', count);
                        model.paging.set('total', this.cached_search_inputs.length);
                    }.bind(this));
                    this.inputs.reset(models);
                    this.inputs._url = undefined;

                    if (this.stateModel.get('search') !== this.emptySearchString) {
                        this.searchCollection(this.stateModel);
                    }
                }.bind(this));
            }
        },

        pageCollection: function (stateModel) {
            var offset = stateModel.get('offset'),
                count = stateModel.get('count'),
                models;
            this.inputs.paging.set('offset', offset);
            this.inputs.paging.set('perPage', count);

            this.inputs.paging.set('total', this.cached_search_inputs.length);
            models = this.cached_search_inputs.models.slice(offset, offset + count);

            _.each(models, function (model) {
                model.paging.set('offset', offset);
                model.paging.set('perPage', count);
                model.paging.set('total', this.cached_search_inputs.length);
            }.bind(this));
            this.inputs.reset(models);
        },

        sortCollection: function (stateModel) {
            var self = this,
                sort_dir = stateModel.get('sortDirection'),
                sort_key = stateModel.get('sortKey'),
                sortable = this.inputs.models,
                all_deferred,
                offset = stateModel.get('offset'),
                count = stateModel.get('count'),
                sort_alphabetical = function (a, b) {
                    var textA = a.entry.content.get(sort_key) ? a.entry.content.get(sort_key).toUpperCase() : '',
                        textB = b.entry.content.get(sort_key) ? b.entry.content.get(sort_key).toUpperCase() : '';
                    if (sort_dir === 'asc') {
                        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    }
                    return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
                },
                sort_numerical = function (a, b) {
                    var numA = a.entry.content.get(sort_key) ? Number(a.entry.content.get(sort_key)) : 0,
                        numB = b.entry.content.get(sort_key) ? Number(b.entry.content.get(sort_key)) : 0;
                    if (sort_dir === 'asc') {
                        return (numA < numB) ? -1 : (numA > numB) ? 1 : 0;
                    }
                    return (numA > numB) ? -1 : (numA < numB) ? 1 : 0;
                },
                handler = {
                    'name': function (a, b) {
                        var textA = a.entry.get(sort_key).toUpperCase(),
                            textB = b.entry.get(sort_key).toUpperCase();

                        if (sort_dir === 'asc') {
                            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                        }
                        return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
                    },
                    'index': sort_alphabetical,
                    'google_credentials_name': sort_alphabetical,
                    'google_project': sort_alphabetical,
                    'disabled': function (a, b) {
                        var textA = a.entry.content.get('disabled') ? 1 : 0,
                            textB = b.entry.content.get('disabled') ? 1 : 0;
                        if (sort_dir === 'asc') {
                            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                        }
                        return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
                    },
                    'service': function (a, b) {
                        var textA = self.serviceMap(a.id),
                            textB = self.serviceMap(b.id);
                        if (sort_dir === 'asc') {
                            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                        }
                        return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
                    }
                };

            all_deferred = this.fetchAllCollection();
            all_deferred.done(function () {
                var temp_collection = this.combineCollection();
                this.cached_inputs = temp_collection[0];
                this.cached_search_inputs = temp_collection[1];
                this.inputs.paging.set('offset', offset);
                this.inputs.paging.set('perPage', count);
                this.inputs.paging.set('total', this.cached_search_inputs.length);

                this.cached_search_inputs.models.sort(handler[sort_key]);
                var models = this.cached_search_inputs.models.slice(offset, offset + count);
                _.each(models, function (model) {
                    model.paging.set('offset', offset);
                    model.paging.set('perPage', count);
                    model.paging.set('total', this.cached_search_inputs.length);
                }.bind(this));
                this.inputs.reset(models);
                this.inputs._url = undefined;
            }.bind(this));
        },

        serviceMap: function (attr) {
            if (attr.indexOf('google_inputs_monitoring') > -1) {
                return "Cloud Monitoring";
            } else if (attr.indexOf('google_inputs_pubsub') > -1) {
                return "Cloud Pub/Sub";
            } else if (attr.indexOf('google_inputs_billing') > -1) {
                return "Cloud Billing";
            } else {
                return "";
            }
        },

        statusMap: function (disabled) {
            return disabled ? 'Disabled' :'Enabled';
        }
    });
});
