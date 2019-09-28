/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc/headerview',
    'contrib/text!app/templates/Common/PageTitle.html',
    'contrib/text!app/templates/Common/TabTemplate.html',
    'app/config/ConfigurationMap',
    'app/models/Authorization',
    'app/views/Configuration/Proxy',
    'app/views/Configuration/Logging',
    'app/views/Configuration/Credential'
], function (
    $,
    _,
    Backbone,
    HeaderView,
    PageTitleTemplate,
    TabTemplate,
    ConfigurationMap,
    Authorization,
    ProxyView,
    LoggingView,
    CredentialView
) {
    return Backbone.View.extend({
        initialize: function () {
            var configuration_template_data = ConfigurationMap.configuration.header,
                title_template = _.template(PageTitleTemplate),
                tab_title_template = '<li <% if (active) { %> class="active" <% } %>><a href="#<%= token%>" id="<%= token%>-li"><%= title%></a></li>',
                tab_content_template = '<div id="<%= token%>-tab" class="tab-pane <% if (active){ %>active<% } %>"></div>',
                // tabs = ConfigurationMap.configuration.tabs,
                renderMap = {
                    'proxy': this.renderProxy.bind(this),
                    'google-credentials': this.renderCredential.bind(this),
                    'logging': this.renderLogging.bind(this)
                },
                self = this;

            $(".addonContainer").append(title_template(configuration_template_data));
            $(".addonContainer").append(_.template(TabTemplate));

            this.proxyRendered = false;
            this.loggingRendered = false;
            this.credentialRendered = false;

            function renderTabs(tabs){
                _.each(tabs, function (tab) {
                    if (tab.title === "Forwarders" && self.show_fowarder === "0") {
                        return;
                    }
                    var title = tab.title,
                        token = title.toLowerCase().replace(/\s/g, '-'),
                        active;

                    if (!self.tabName) {
                        active = tab.active;
                    } else if (self.tabName && self.tabName === token) {
                        active = true;
                    }

                    $(".nav-tabs").append(_.template(tab_title_template, {title: title, token: token, active: active}));
                    $(".tab-content").append(_.template(tab_content_template, {token: token, active: active}));
                    //render each tab content
                    renderMap[token]();
                });
            }
            var tabs = ConfigurationMap.configuration.allTabs;
            renderTabs(tabs);

            //Router for each tab
            var Router = Backbone.Router.extend({
                routes: {
                    '*filter': 'changeTab'
                },
                changeTab: function (params) {
                    if (params === null) {
                        return;
                    }

                    self.tabName = params;
                    $('.nav-tabs li').removeClass('active');
                    $('#' + self.tabName + '-li').parent().addClass('active');
                    $('.tab-content div').removeClass('active');
                    $('#' + params + '-tab').addClass('active');
                }
            });
            var router = new Router();
            Backbone.history.start();
        },

        renderProxy: function () {
            if (!this.proxyRendered) {
                var proxy_view = new ProxyView();
                $("#proxy-tab").append(proxy_view.render().$el);
                this.proxyRendered = true;
            }
        },

        renderCredential: function () {
            if (!this.credentialRendered) {
                var credential_view = new CredentialView();
                $('#google-credentials-tab').html(credential_view.render().$el);
                this.credentialRendered = true;
            }
        },

        renderLogging: function () {
            if (!this.loggingRendered) {
                var logging_view = new LoggingView();
                $('#logging-tab').html(logging_view.render().$el);
                this.loggingRendered = true;
            }
        }
    });
});
