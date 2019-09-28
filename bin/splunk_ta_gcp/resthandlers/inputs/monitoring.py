
import splunk.admin as admin

from splunktaucclib.rest_handler import base, validator
from splunktalib.common import util

util.remove_http_proxy_env_vars()


class MonitoringInputs(base.BaseModel):
    """REST Endpoint of Server in Splunk Add-on UI Framework.
    """
    rest_prefix = 'google'
    endpoint = 'configs/conf-google_cloud_monitor_inputs'
    requiredArgs = {
        'google_credentials_name',
        'google_project',
        'google_metrics',
        'polling_interval',
        'oldest',
    }
    optionalArgs = {'index', 'disabled'}
    defaultVals = {
        'index': 'default'
    }
    validators = {
        'oldest': validator.Datetime('%Y-%m-%dT%H:%M:%S'),
        'polling_interval': validator.Number(min_val=1),
    }
    cap4endpoint = ''
    cap4get_cred = ''


def main():
    admin.init(
        base.ResourceHandler(MonitoringInputs),
        admin.CONTEXT_APP_AND_USER,
    )
