
import splunk.admin as admin

from splunktaucclib.rest_handler import base, datainput, validator, normaliser
from splunktalib.common import util

util.remove_http_proxy_env_vars()


class PubSubInputs(datainput.DataInputModel):
    """REST Endpoint of Server in Splunk Add-on UI Framework.
    """
    # rest_prefix = 'google'
    endpoint = 'configs/conf-google_cloud_pubsub_inputs'
    dataInputName = 'google_cloud_pubsub'
    requiredArgs = {
        'google_credentials_name',
        'google_project',
        'google_subscriptions'
    }
    optionalArgs = {'sourcetype', 'index', 'disabled'}
    defaultVals = {
        'sourcetype': 'google:gcp:pubsub:message',
        'index': 'default'
    }
    # normalisers = {
    #     'disabled': normaliser.Boolean()
    # }
    validators = {}

    # Custom Actions
    cap4endpoint = ''
    cap4get_cred = ''

def main():
    admin.init(
        base.ResourceHandler(PubSubInputs, handler=datainput.DataInputHandler),
        admin.CONTEXT_APP_AND_USER)
