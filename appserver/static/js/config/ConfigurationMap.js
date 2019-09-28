/*global define*/
define([], function (
) {
    return {
        "configuration": {
            "header": {
                title: "Configuration",
                description: "Configure your Google credentials, settings, proxy and node information",
                enableButton: false,
                enableHr: false
            },
            "tabsMap": {},
            "allTabs": [
                {
                    title: "Google Credentials",
                    order: 0,
                    active: true
                },
                {
                    title: "Logging",
                    order: 1
                },
                {
                    title: "Proxy",
                    order: 2
                }
            ]
        }
    };
});
