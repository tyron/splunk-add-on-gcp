/*global define,window*/
define([
    'underscore',
    'app/models/Credential',
    'app/views/Models/TextDisplayControl',
    'views/shared/controls/TextControl',
    'app/views/Models/TextareaControl',
    'app/views/Models/SingleInputControl',
    'app/views/Models/SingleInputControlEx',
    'views/shared/controls/SyntheticCheckboxControl',
    'app/views/Models/MultiSelectInputControl',
    'app/views/Models/MultiSelectInputControlFieldEditable',
    'app/models/InputsPubSub',
    'app/collections/InputsPubSubCollection',
    'app/models/InputsMonitoring',
    'app/collections/InputsMonitoringCollection',
    'app/models/InputsBilling',
    'app/collections/InputsBillingCollection'
], function (
    _,
    Credential,
    TextDisplayControl,
    TextControl,
    TextareaControl,
    SingleInputControl,
    SingleInputControlEx,
    SyntheticCheckboxControl,
    MultiSelectInputControl,
    MultiSelectInputControlFieldEditable,
    InputsPubSub,
    InputsPubSubCollection,
    InputsMonitoring,
    InputsMonitoringCollection,
    InputsBilling,
    InputsBillingCollection
) {
    return {
        "input": {
            "title": "Input",
            "caption": {
                title: "Inputs for Google Cloud Platform",
                description: 'Create data inputs to collect data from Google Cloud Service.',
                enableButton: true,
                singleInput: false,
                buttonId: "addInputBtn",
                buttonValue: "Create New Input",
                enableHr: true
            },
            "header": [
                {
                    "field": "name",
                    "label": "Name",
                    "sort": true,
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "service",
                    "label": "Service",
                    "sort": true,
                    mapping: function (model) {
                        if (model.id.indexOf('google_inputs_pubsub') > -1) {
                            return "Cloud Pub/Sub";
                        }
                        if (model.id.indexOf('google_inputs_monitoring') > -1) {
                            return "Cloud Monitoring";
                        }
                        if (model.id.indexOf('google_inputs_billing') > -1) {
                            return "Cloud Billing";
                        }
                    }
                },
                {
                    "field": "google_credentials_name",
                    "label": "Google Credentials",
                    "sort": true,
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "google_project",
                    "label": "Project",
                    "sort": true,
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "index",
                    "label": "Index",
                    "sort": true,
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "disabled",
                    "label": "Status",
                    "sort": true,
                    mapping: function (field) {
                        return field ? "Disabled" : "Enabled";
                    }
                }
            ],
            "moreInfo": [
                {
                    "field": "name",
                    "label": "Name",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "google_credentials_name",
                    "label": "Credentials",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "google_project",
                    "label": "Project",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "google_subscriptions",
                    "label": "Pub/Sub Subscriptions",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "google_metrics",
                    "label": "Google Cloud Monitor Metrics",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "index",
                    "label": "Index",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "disabled",
                    "label": "Status",
                    mapping: function (field) {
                        return field ? "Disabled" : "Enabled";
                    }
                },
                {
                    "field": "oldest",
                    "label": "Start Date Time",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {
                    "field": "polling_interval",
                    "label": "Interval",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                }
            ],
            "services": {
                "InputsPubSub": {
                    "title": "Cloud Pub/Sub",
                    "model": InputsPubSub,
                    "url": "",
                    "collection": InputsPubSubCollection,
                    "entity": [
                        {
                            "field": "name",
                            "label": "Name",
                            "type": TextControl,
                            "required": true
                        },
                        {
                            "field": "google_credentials_name",
                            "label": "Credentials",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "google_project",
                            "label": "Project",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "google_subscriptions",
                            "label": "Pub/Sub Subscriptions",
                            "type": MultiSelectInputControl,
                            "required": true
                        },
                        {
                            "field": "index",
                            "label": "Index",
                            "type": SingleInputControlEx,
                            "required": true,
                            "defaultValue": "default"
                        }
                    ],
                    "actions": [
                        "edit",
                        "delete",
                        "enable",
                        "clone"
                    ]
                },

                "InputsMonitoring": {
                    "title": "Cloud Monitoring",
                    "model": InputsMonitoring,
                    "url": "",
                    "collection": InputsMonitoringCollection,
                    "entity": [
                        {
                            "field": "name",
                            "label": "Name",
                            "type": TextControl,
                            "required": true
                        },
                        {
                            "field": "google_credentials_name",
                            "label": "Credentials",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "google_project",
                            "label": "Project",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "google_metrics",
                            "label": "Cloud Monitor Metrics",
                            "type": MultiSelectInputControl,
                            "required": true
                        },
                        {
                            "field": "polling_interval",
                            "label": "Interval",
                            "type": TextControl,
                            "required": true,
                            "defaultValue": "300"
                        },
                        {
                            "field": "oldest",
                            "label": "Start Date Time",
                            "type": TextControl,
                            "required": true,
                            "help": "UTC datetime in this format: %Y-%m-%dT%H:%M:%S. For example: 2015-01-10T20:20:20",
                            "defaultValue": function () {
                                var oneWeekAgo, year, month, day, hour, minute, second;
                                oneWeekAgo = new Date(new Date().setDate(new Date().getDate()-7));
                                year = oneWeekAgo.getFullYear();
                                month = oneWeekAgo.getMonth() + 1;
                                if (month < 10) {
                                    month = "0" + month;
                                }
                                day = oneWeekAgo.getDate();
                                if (day < 10) {
                                    day = "0" + day;
                                }
                                hour = oneWeekAgo.getHours();
                                if (hour < 10) {
                                    hour = "0" + hour;
                                }
                                minute = oneWeekAgo.getMinutes();
                                if (minute < 10) {
                                    minute = "0" + minute;
                                }
                                second = oneWeekAgo.getSeconds();
                                if (second < 10) {
                                    second = "0" + second;
                                }
                                return year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" +second;
                            }
                        },
                        {
                            "field": "index",
                            "label": "Index",
                            "type": SingleInputControlEx,
                            "required": true,
                            "defaultValue": "default"
                        }
                    ],
                    "actions": [
                        "edit",
                        "delete",
                        "enable",
                        "clone"
                    ]
                },

                "InputsBilling": {
                    "title": "Cloud Billing",
                    "model": InputsBilling,
                    "url": "",
                    "collection": InputsBillingCollection,
                    "entity": [
                        {
                            "field": "name",
                            "label": "Name",
                            "type": TextControl,
                            "required": true
                        },
                        {
                            "field": "google_credentials_name",
                            "label": "Credentials",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "google_project",
                            "label": "Project",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "bucket_name",
                            "label": "Bucket",
                            "type": SingleInputControl,
                            "required": true
                        },
                        {
                            "field": "report_prefix",
                            "label": "Report Prefix",
                            "type": TextControl,
                            "required": true,
                            "help": "This needs to be same with the configuration of billing export in Google Cloud Platform",
                        },
                        {
                            "field": "ingestion_start",
                            "label": "Start Date",
                            "type": TextControl,
                            "required": false,
                            "help": "UTC date in this format: YYYY-mm-dd. The default is 1970-01-01, the earliest date",
                            "defaultValue": function () {
                                var oneWeekAgo, year, month, day;
                                oneWeekAgo = new Date(new Date().setDate(new Date().getDate()-7));
                                year = oneWeekAgo.getFullYear();
                                month = oneWeekAgo.getMonth() + 1;
                                if (month < 10) {
                                    month = "0" + month;
                                }
                                day = oneWeekAgo.getDate();
                                if (day < 10) {
                                    day = "0" + day;
                                }
                                return year + "-" + month + "-" + day;
                            },
                        },
                        {
                            "field": "polling_interval",
                            "label": "Interval",
                            "type": TextControl,
                            "required": true,
                            "defaultValue": "3600",
                            "help": "Default is 3600 seconds. It is not recommended to use a smaller interval",
                        },
                        {
                            "field": "index",
                            "label": "Index",
                            "type": SingleInputControlEx,
                            "required": true,
                            "defaultValue": "default"
                        }
                    ],
                    "actions": [
                        "edit",
                        "delete",
                        "enable",
                        "clone"
                    ]
                }
            },
            filterKey: ['name', 'service', 'google_credentials_name', 'google_project', 'index', 'status']
        },

        "credential": {
            "model": Credential,
            "title": "Google Credentials",
            "header": [
                {
                    "field": "name",
                    "label": "Name",
                    "sort": true,
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }

                },
                {
                    "field": "google_credentials",
                    "label": "Google Credentials",
                    "sort": true,
                    mapping: function (field) {
                        return "********";
                    }
                }
            ],
            "moreInfo": [
                {
                    "field": "name",
                    "label": "Name",
                    mapping: function (field) {
                        return field.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                },
                {"field": "google_credentials", "label": "Google Credentials"}
            ],
            "entity": [
                {
                    "field": "name",
                    "label": "Name",
                    "type": TextControl,
                    "required": true
                },
                {
                    "field": "google_credentials",
                    "label": "Google Service Account Credentials",
                    "type": TextareaControl,
                    "required": true,
                    "encrypted": true
                }
            ],
            "refLogic": function (model, refModel) {
                return model.entry.attributes.name === refModel.entry.content.attributes.google_credentials_name;
            },
            "actions": [
                "edit",
                "delete"
            ],
            "tag": "credentials"
        },

        "proxy": {
            "title": "Proxy",
            "entity": [
                {"field": "proxy_enabled", "label": "Enable", "type": SyntheticCheckboxControl},
                {
                    "field": "proxy_type",
                    "label": "Proxy Type",
                    "type": SingleInputControl,
                    "options": {
                        "disableSearch": true,
                        "autoCompleteFields": [
                            {"label": "http", "value": "http"},
                            {"label": "http_no_tunnel", "value": "http_no_tunnel"},
                            {"label": "socks4", "value": "socks4"},
                            {"label": "socks5", "value": "socks5"}
                        ]
                    },
                    "defaultValue": "http"
                },
                {"field": "proxy_rdns", "label": "DNS Resolution", "type": SyntheticCheckboxControl},
                {"field": "proxy_url", "label": "Host", "type": TextControl},
                {"field": "proxy_port", "label": "Port", "type": TextControl},
                {"field": "proxy_username", "label": "Username", "type": TextControl},
                {
                    "field": "proxy_password",
                    "label": "Password",
                    "type": TextControl,
                    "encrypted": true,
                    "associated": "username"
                }
            ]
        },

        "logging": {
            "title": "Logging",
            "entity": [
                {
                    "field": "log_level",
                    "label": "Logging Level",
                    "type": SingleInputControl,
                    "options": {
                        "disableSearch": true,
                        "autoCompleteFields": [
                            {"label": "INFO", "value": "INFO"},
                            {"label": "DEBUG", "value": "DEBUG"},
                            {"label": "ERROR", "value": "ERROR"}
                        ]
                    },
                    "defaultValue": "INFO"
                }
            ]
        }
    };
});
