/*global define,console,window,addEventListener,attachEvent*/
define([
    'jquery',
    'underscore',
    'backbone',
    'app/models/appData',
    'app/util/Util',
    'contrib/text!app/templates/Common/AddDialog.html',
    'contrib/text!app/templates/Common/EditDialog.html',
    'contrib/text!app/templates/Common/CloneDialog.html',
    'contrib/text!app/templates/Common/TabTemplate.html',
    'contrib/text!app/templates/Models/ErrorMsg.html',
    'contrib/text!app/templates/Models/LoadingMsg.html',
    'app/views/Models/ControlWrapper',
    'app/models/InputsPubSub',
    'app/models/InputsMonitoring',
    'app/models/InputsBilling',
    'app/models/Credential',
    'app/collections/Indexes',
    'app/collections/Credentials',
    'app/config/ContextMap'
], function (
    $,
    _,
    Backbone,
    appData,
    Util,
    AddDialogTemplate,
    EditDialogTemplate,
    CloneDialogTemplate,
    TabTemplate,
    ErrorMsg,
    LoadingMsg,
    ControlWrapper,
    InputsPubSub,
    InputsMonitoring,
    InputsBilling,
    Credential,
    Indexes,
    Credentials,
    ContextMap
) {
    return Backbone.View.extend({
        initialize: function (options) {
            this.collection = options.collection;
            this.mode = options.mode;
            this.dispatcher = options.dispatcher;
            this.component = options.component;
            this.isInput = options.isInput;

            this.model = new Backbone.Model({});

            // Clear timeout callback for account
            this.called = false;
            if (window.timer_id) {
                window.clearTimeout(window.timer_id);
            }

            var InputType;
            if (!options.model) { //Create mode
                this.mode = "create";
                this.model = new Backbone.Model({});
                InputType = this.component.model;
                this.real_model = new InputType(null, {
                    appData: this.appData,
                    collection: this.collection
                });
            } else if (this.mode === "edit") { //Edit mode
                this.model = options.model.entry.content.clone();
                this.model.set({name: options.model.entry.get("name")});
                this.real_model = options.model;
            } else if (this.mode === "clone") { //Clone mode
                this.model = options.model.entry.content.clone();
                //Unset the name attribute if the model is newly created
                if (this.model.get("name")) {
                    this.model.unset("name");
                }
                //Unset the refCount attribute
                if (this.model.get("refCount")) {
                    this.model.unset("refCount");
                }
                this.cloneName = options.model.entry.get("name");
                InputType = this.component.model;
                this.real_model = new InputType({
                    appData: this.appData,
                    collection: this.collection
                });
            }
            this.real_model.on("invalid", this.displayValidationError.bind(this));

            var self = this;
            this.model.on('change:google_credentials_name', function () {
                self.removeErrorMsg();
                self.addLoadingMsg("Loading Projects...");
                var url = '';
                url = [
                        $C.LOCALE,
                        "splunkd/__raw/servicesNS/nobody",
                        ContextMap.appName,
                        "splunk_ta_google/google_projects"
                    ].join("/");
                $.get(
                    "/" + url,
                    {
                        "google_credentials_name": self.model.get("google_credentials_name"),
                        "output_mode": "json"
                    }
                ).done(function (model) {
                        self.removeLoadingMsg();
                        var projects, dic;
                        projects = model.entry[0].content.projects;
                        dic = _.map(projects, function (project) {
                            return {
                                label: project,
                                value: project
                            };
                        });
                    self.google_project.control.setAutoCompleteFields(dic, true);
                }).fail(function (model) {
                    self.removeLoadingMsg();
                    self.displayError(model);
                });
            });

            this.model.on('change:google_project', function() {
                var url = '';
                // remove previous error message if exist
                self.removeErrorMsg();
                if (self.component.model === InputsPubSub) {
                    self.addLoadingMsg("Loading Subscriptions...");
                    url = [
                        $C.LOCALE,
                        "splunkd/__raw/servicesNS/nobody",
                        ContextMap.appName,
                        "splunk_ta_google/google_subscriptions"
                    ].join("/");
                    $.get(
                        "/" + url,
                        {
                            "google_credentials_name": self.model.get("google_credentials_name"),
                            "google_project": self.model.get("google_project"),
                            "output_mode": "json"
                        }
                    ).done(function (model) {
                            self.removeLoadingMsg();
                            var subscriptions = model.entry[0].content.subscriptions;
                            self.google_subscriptions.control.setItems(subscriptions, true);
                        }).fail(function (model) {
                            self.removeLoadingMsg();
                            self.displayError(model);
                        });
                } else if (self.component.model === InputsMonitoring) {
                    self.addLoadingMsg("Loading Metrics...");
                    url = [
                        $C.LOCALE,
                        "splunkd/__raw/servicesNS/nobody",
                        ContextMap.appName,
                        "splunk_ta_google/google_metrics"
                    ].join("/");
                    $.get(
                        "/" + url,
                        {
                            "google_credentials_name": self.model.get("google_credentials_name"),
                            "google_project": self.model.get("google_project"),
                            "output_mode": "json"
                        }
                    ).done(function (model) {
                            self.removeLoadingMsg();
                            var metrics;
                            metrics = model.entry[0].content.metrics;
                            self.google_metrics.control.setItems(metrics, true);
                        }).fail(function (model) {
                            self.removeLoadingMsg();
                            // extract required error_msg from response text to show some meaningful message
                            var error_msg = model.responseText;
                            var regex = /.+from python handler:\s\\\"(?:\<)?(?:HttpsError)?([\S\s]+?)(?:\\\">)?\\\"\.\s*See splunkd\.log for more details\./;
                            var matches = regex.exec(model.responseText);
                            if (matches && matches[1]) {
                                try {
                                    error_msg = matches[1]
                                } catch (error) {
                                     error_msg = model.responseText;
                                }
                            }
                            // set the obtained error message
                            self.addErrorMsg(error_msg);
                        });
                } else if (self.component.model === InputsBilling) {
                    self.addLoadingMsg("Loading Buckets...");
                    url = [
                        $C.LOCALE,
                        "splunkd/__raw/servicesNS/nobody",
                        ContextMap.appName,
                        "splunk_ta_google/google_buckets"
                    ].join("/");
                    $.get(
                        "/" + url,
                        {
                            "google_credentials_name": self.model.get("google_credentials_name"),
                            "google_project": self.model.get("google_project"),
                            "output_mode": "json"
                        }
                    ).done(function (model) {
                        self.removeLoadingMsg();
                        var buckets, dict;
                        buckets = model.entry[0].content.buckets;
                        dict = _.map(buckets, function (bucket) {
                            return {
                                label: bucket,
                                value: bucket
                            };
                        });
                        self.bucket_name.control.setAutoCompleteFields(dict, true);
                    }).fail(function (model) {
                        self.removeLoadingMsg();
                        self.displayError(model);
                    });
                }
            });
        },

        modal: function () {
            this.$("[role=dialog]").modal({backdrop: 'static', keyboard: false});
        },

        submitTask: function () {
            //Disable the button to prevent repeat submit
            this.$("input[type=submit]").attr('disabled', true);

            // Remove loading and error message
            this.removeErrorMsg();
            this.removeLoadingMsg();
            this.saveModel();
        },

        saveModel: function () {
            var input = this.real_model,
                new_json = this.model.toJSON(),
                original_json = input.entry.content.toJSON(),
                //Add label attribute for validation prompt
                entity = this.component.entity,
                attr_labels = {};
            _.each(entity, function (e) {
                attr_labels[e.field] = e.label;
            });

            input.entry.content.set(new_json);
            input.attr_labels = attr_labels;

            this.save(input, original_json);
        },

        save: function (input, original_json) {
            var deffer = input.save();

            if (!deffer.done) {
                input.entry.content.set(original_json);
                input.trigger('change');

                //Re-enable when failed
                this.$("input[type=submit]").removeAttr('disabled');
            } else {
                this.addLoadingMsg("Saving...");
                deffer.done(function () {
                    this.collection.trigger('change');
                    //Delete encrypted field before adding to collection
                    if (this.encrypted_field) {
                        delete input.entry.content.attributes[this.encrypted_field];
                    }

                    //Add model to collection
                    if (this.mode !== 'edit') {
                        this.collection.add(input);
                        if (this.collection.length !== 0) {
                            _.each(this.collection.models, function (model) {
                                model.paging.set('total', this.collection.length);
                            }.bind(this));
                        }
                        //Trigger collection page change event to refresh the count in table caption
                        this.collection.paging.set('total', this.collection.models.length);    
                        //Trigger collection reset event to refresh the count in table caption
                        this.collection.reset(this.collection.models);
                        //trigger type change event
                        // TODO: Change me
                        //if (this.dispatcher) {
                        //this.dispatcher.trigger('filter-change',this.service_type);
                        //}
                    }
                    this.$("[role=dialog]").modal('hide');
                    this.undelegateEvents();
                }.bind(this)).fail(function (model, response) {
                    input.entry.content.set(original_json);
                    input.trigger('change');
                    // re-enable when failed
                    this.$("input[type=submit]").removeAttr('disabled');
                    this.removeLoadingMsg();
                    this.displayError(model, response);
                }.bind(this));
            }
        },

        render: function () {
            var template_map = {
                    "create": AddDialogTemplate,
                    "edit": EditDialogTemplate,
                    "clone": CloneDialogTemplate
                },
                template = _.template(template_map[this.mode]),
                json_data = this.mode === "clone" ? {
                    name: this.cloneName,
                    title: this.component.title
                } : {
                    title: this.component.title,
                    isInput: this.isInput
                },
                entity = this.component.entity,
                self = this;

            this.$el.html(template(json_data));

            this.$("[role=dialog]").on('hidden.bs.modal', function () {
                this.undelegateEvents();
            }.bind(this));

            this.children = [];
            _.each(entity, function (e) {
                var option, controlWrapper, controlOptions;
                if (e.encrypted) {
                    this.encrypted_field = e.field;
                }

                if (this.model.get(e.field) === undefined && e.defaultValue) {
                    if (e.defaultValue instanceof Function) {
                        this.model.set(e.field, e.defaultValue());
                    } else {
                        this.model.set(e.field, e.defaultValue);
                    }
                }

                controlOptions = {
                    model: this.model,
                    modelAttribute: e.field,
                    password: e.encrypted ? true : false,
                    displayText: e.displayText,
                    helpLink: e.helpLink
                };

                for (option in e.options) {
                    if (e.options.hasOwnProperty(option)) {
                        controlOptions[option] = e.options[option];
                    }
                }

                controlWrapper = new ControlWrapper({
                    label: _(e.label).t(),
                    controlType: e.type,
                    wrapperClass: e.field,
                    required: e.required ? true : false,
                    help: e.help || null,
                    controlOptions: controlOptions
                });

                if (e.field === 'index') {
                    this._loadIndex(controlWrapper);
                }

                if (e.field === 'google_credentials_name') {
                    this._loadAccount(controlWrapper);
                }

                //Add specific code for Google Cloud Platform
                var url = '';
                if (e.field === 'google_project') {
                    this.google_project = controlWrapper;
                    //Load projects when edit or clone
                    if (this.mode !== "create") {
                        url = [
                            $C.LOCALE,
                            "splunkd/__raw/servicesNS/nobody",
                            ContextMap.appName,
                            "splunk_ta_google/google_projects"
                        ].join("/");
                        $.get(
                            "/" + url,
                            {
                                "google_credentials_name": self.model.get("google_credentials_name"),
                                "output_mode": "json"
                            }
                        ).done(function (model) {
                                var projects, dict;
                                projects = model.entry[0].content.projects;
                                dict = _.map(projects, function (project) {
                                    return {
                                        label: project,
                                        value: project
                                    };
                                });
                                self.google_project.control.setAutoCompleteFields(dict, true);
                            }).fail(function (model) {
                                self.removeLoadingMsg();
                                self.displayError(model);
                            });
                    }
                }
                if (e.field === 'google_subscriptions') {
                    this.google_subscriptions = controlWrapper;
                    if (this.mode !== "create") {
                        url = [
                            $C.LOCALE,
                            "splunkd/__raw/servicesNS/nobody",
                            ContextMap.appName,
                            "splunk_ta_google/google_subscriptions"
                        ].join("/");
                        $.get(
                            "/" + url,
                            {
                                "google_credentials_name": self.model.get("google_credentials_name"),
                                "google_project": self.model.get("google_project"),
                                "output_mode": "json"
                            }
                        ).done(function (model) {
                                self.removeLoadingMsg();
                                var subscriptions = model.entry[0].content.subscriptions;
                                var valArray = self.model.get("google_subscriptions").split(",");
                                self.google_subscriptions.control.setItems(subscriptions, true);
                            }).fail(function (model) {
                                self.removeLoadingMsg();
                                self.displayError(model);
                            });
                    }
                }
                if (e.field === 'google_metrics') {
                    this.google_metrics = controlWrapper;
                    if (this.mode !== "create") {
                        url = [
                            $C.LOCALE,
                            "splunkd/__raw/servicesNS/nobody",
                            ContextMap.appName,
                            "splunk_ta_google/google_metrics"
                        ].join("/");
                        $.get(
                            "/" + url,
                            {
                                "google_credentials_name": self.model.get("google_credentials_name"),
                                "google_project": self.model.get("google_project"),
                                "output_mode": "json"
                            }
                        ).done(function (model) {
                                self.removeLoadingMsg();
                                var metrics, dict;
                                metrics = model.entry[0].content.metrics;
                                self.google_metrics.control.setItems(metrics, true);
                            }).fail(function (model) {
                                self.removeLoadingMsg();
                                self.displayError(model);
                            });
                    }
                }

                if (e.field === 'bucket_name') {
                    this.bucket_name = controlWrapper;
                    if (this.mode !== "create") {
                        url = [
                            $C.LOCALE,
                            "splunkd/__raw/servicesNS/nobody",
                            ContextMap.appName,
                            "splunk_ta_google/google_buckets"
                        ].join("/");
                        $.get(
                            "/" + url,
                            {
                                "google_credentials_name": self.model.get("google_credentials_name"),
                                "google_project": self.model.get("google_project"),
                                "output_mode": "json"
                            }
                        ).done(function (model) {
                            self.removeLoadingMsg();
                            var buckets, dict;
                            buckets = model.entry[0].content.buckets;
                            dict = _.map(buckets, function (bucket) {
                                return {
                                    label: bucket,
                                    value: bucket
                                };
                            });
                            self.bucket_name.control.setAutoCompleteFields(dict, true);
                        }).fail(function (model) {
                            self.removeLoadingMsg();
                            self.displayError(model);
                        });
                    }
                }

                if (e.display !== undefined) {
                    controlWrapper.$el.css("display", "none");
                }

                this.children.push(controlWrapper);
            }.bind(this));

            _.each(this.children, function (child) {
                this.$('.modal-body').append(child.render().$el);
            }.bind(this));

            if (this.component.tabs) {
                this.renderSetting();
            }

            //Disable the name field in edit mode
            if (this.mode === 'edit') {
                this.$("input[name=name]").attr("readonly", "readonly");
            }

            this.$("input[type=submit]").on("click", this.submitTask.bind(this));

            return this;
        },

        renderSetting: function () {
            $(".modal-body").append(_.template(TabTemplate));

            var tab_title_template = '<li <% if (active) { %> class="active" <% } %>><a data-toggle="tab" href="#<%= token%>-tab" id="<%= token%>-li"><%= title%></a></li>',
                tab_content_template = '<div id="<%= token%>-tab" class="tab-pane <% if (active){ %>active<% } %>"></div>',
                tabs = this.component.tabs,
                k,
                token,
                active,
                children,
                i,
                renderTab = function (e) {
                    var option, controlOptions, controlWrapper;
                    if (e.encrypted) {
                        this.encrypted_field = e.field;
                    }

                    controlOptions = {
                        model: this.model,
                        modelAttribute: e.field,
                        password: e.encrypted ? true : false
                    };
                    for (option in e.options) {
                        if (e.options.hasOwnProperty(option)) {
                            controlOptions[option] = e.options[option];
                        }
                    }
                    controlWrapper = new ControlWrapper({
                        label: _(e.label).t(),
                        controlType: e.type,
                        wrapperClass: e.field,
                        required: e.required ? true : false,
                        help: e.help || null,
                        controlOptions: controlOptions
                    });

                    if (e.field === 'index') {
                        this._loadIndex(controlWrapper);
                    }
                    children.push(controlWrapper);
                },
                appendToTab = function (token, child) {
                    $("#" + token + "-tab").append(child.render().$el);
                };

            for (k in tabs) {
                if (tabs.hasOwnProperty(k)) {
                    token = k.toLowerCase().replace(' ', '-');
                    active = tabs[k].active;

                    $(".nav-tabs").append(_.template(tab_title_template, {title: k, token: token, active: active}));
                    $(".tab-content").append(_.template(tab_content_template, {token: token, active: active}));
                    children = [];
                    for (i = 0; i < tabs[k].length; i += 1) {
                        renderTab(tabs[k][i]);
                    }

                    for (i = 0; i < children.length; i += 1) {
                        appendToTab(token, children[i]);
                    }

                    //Make the first tab active
                    $(".modal-body .nav-tabs li:first-child").addClass("active");
                    $(".modal-body .tab-content div:first-child").addClass("active");
                }
            }
        },

        displayValidationError: function (error) {
            this.removeLoadingMsg();
            if (this.$('.msg-text').length) {
                this.$('.msg-text').text(error.validationError);
            } else {
                this.$(".modal-body").prepend(_.template(ErrorMsg, {msg: error.validationError}));
            }
        },

        addErrorMsg: function (text) {
            if (this.$('.msg-error').length) {
                this.$('.msg-error > .msg-text').text(text);
            } else {
                this.$(".modal-body").prepend(_.template(ErrorMsg, {msg: text}));
            }
        },

        removeErrorMsg: function () {
            if (this.$('.msg-error').length) {
                this.$('.msg-error').remove();
            }
        },

        addLoadingMsg: function (text) {
            if (this.$('.msg-loading').length) {
                this.$('.msg-loading > .msg-text').text(text);
            } else {
                this.$(".modal-body").prepend(_.template(LoadingMsg, {msg: text}));
            }
        },

        removeLoadingMsg: function () {
            if (this.$('.msg-loading').length) {
                this.$('.msg-loading').remove();
            }
        },

        parseAjaxError: function (model) {
            var rsp = JSON.parse(model.responseText),
                regx = /In handler.+and output:\s+\'([\s\S]*)\'\.\s+See splunkd\.log for stderr output\./,
                msg = String(rsp.messages[0].text),
                matches = regx.exec(msg);
            if (!matches || !matches[1]) {
                // try to extract another one
                regx = /In handler[^:]+:\s+(.*)/;
                matches = regx.exec(msg);
                if (!matches || !matches[1]) {
                    return msg;
                }
            }
            return matches[1];
        },

        displayError: function (model) {
            this.addErrorMsg(this.parseAjaxError(model));
        },

        _loadIndex: function (controlWrapper) {
            var indexes = new Indexes([], {
                appData: {app: appData.get("app"), owner: appData.get("owner")},
                targetApp: Util.getAddonName(),
                targetOwner: "nobody"
            });
            indexes.deferred = indexes.fetch();
            indexes.deferred.done(function () {
                var id_lst = _.map(indexes.models[0].attributes.entry[0].content.indexes, function (index) {
                    return {
                        label: index,
                        value: index
                    };
                });

                //Ensure the model's index value in list
                id_lst = this._ensureIndexInList(id_lst);

                if (_.find(id_lst, function (item) {
                        return item.value === "default";
                    }) === undefined) {
                    id_lst = id_lst.concat({
                        label: "default",
                        value: "default"
                    });
                }

                controlWrapper.control.setAutoCompleteFields(id_lst, true);
            }.bind(this)).fail(function () {
                this.addErrorMsg("Failed to load index");
            }.bind(this));
        },

        _loadAccount: function (controlWrapper) {
            this.credentials = new Credentials([], {
                appData: {app: appData.get("app"), owner: appData.get("owner")},
                targetApp: this.addonName,
                targetOwner: "nobody"
            });
            var credentials_defered = this.credentials.fetch();
            credentials_defered.done(function () {
                var dic = _.map(this.credentials.models, function (credential) {
                    return {
                        label: credential.entry.attributes.name,
                        value: credential.entry.attributes.name
                    };
                });

                controlWrapper.control.setAutoCompleteFields(dic, true);
            }.bind(this));
        },

        _ensureIndexInList: function (data) {
            var selected_value = this.model.get('index'),
                selected_value_item = [];
            if (selected_value) {
                selected_value_item = {label: selected_value, value: selected_value};
            }
            if (_.find(data, function (item) {
                    return item.value === selected_value_item.value;
                }) === undefined) {
                data = data.concat(selected_value_item);
            }
            return data;
        }
    });
});
