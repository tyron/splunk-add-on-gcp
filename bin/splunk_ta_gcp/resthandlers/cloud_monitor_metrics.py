import logging
from splunktalib.common import util

import splunk.admin as admin
import splunk.clilib.cli_common as scc
import splunktalib.common.pattern as scp

import splunk_ta_gcp.legacy.consts as ggc
import splunk_ta_gcp.legacy.config as gconf
import splunk_ta_gcp.modinputs.cloud_monitor.consts as gmc
import splunk_ta_gcp.modinputs.cloud_monitor.wrapper as gmw


logger = logging.getLogger()
util.remove_http_proxy_env_vars()


class GoogleCloudMonitorMetrics(admin.MConfigHandler):
    valid_params = [ggc.google_credentials_name, ggc.google_project]

    def setup(self):
        for param in self.valid_params:
            self.supportedArgs.addOptArg(param)

    @scp.catch_all(logger)
    def handleList(self, conf_info):
        logger.info("start listing google cloud monitor metrics")
        for required in self.valid_params:
            if not self.callerArgs or not self.callerArgs.get(required):
                logger.error('Missing "%s"', required)
                raise Exception('Missing "{}"'.format(required))

        stanza_name = self.callerArgs[ggc.google_credentials_name][0]
        config = gconf.get_google_settings(
            scc.getMgmtUri(), self.getSessionKey(), cred_name=stanza_name)

        project = self.callerArgs[ggc.google_project][0]
        monitor = gmw.GoogleCloudMonitor(logger, config)
        metric_descs = monitor.metric_descriptors(project)
        metrics = [desc["type"] for desc in metric_descs]
        conf_info[gmc.google_metrics].append("metrics", metrics)
        logger.info("end of listing google cloud monitor metrics")


def main():
    admin.init(GoogleCloudMonitorMetrics, admin.CONTEXT_NONE)


