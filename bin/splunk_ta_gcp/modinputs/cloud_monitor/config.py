import splunk_ta_gcp.legacy.config as gconf
import splunk_ta_gcp.legacy.consts as ggc
try :
    from . import consts as gmc
    from . import wrapper as gmw
except ImportError:
    import consts as gmc
    import wrapper as gmw



class GoogleCloudMonitorConfig(gconf.GoogleConfig):

    def __init__(self):
        super(GoogleCloudMonitorConfig, self).__init__(
            ggc.google_cloud_monitor)

    @staticmethod
    def data_collection_conf():
        return gmc.myta_data_collection_conf

    @staticmethod
    def _metric_key():
        return gmc.google_metrics

    @staticmethod
    def _get_metrics(logger, config):
        monitor = gmw.GoogleCloudMonitor(logger, config)
        metric_descs = monitor.metric_descriptors(config[ggc.google_project])
        return [desc["type"] for desc in metric_descs]
