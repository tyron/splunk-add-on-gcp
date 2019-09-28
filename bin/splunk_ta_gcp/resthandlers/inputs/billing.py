
import splunk.admin as admin
from splunktaucclib.rest_handler import base, validator


class BillingInputs(base.BaseModel):
    """REST Endpoint of Server in Splunk Add-on UI Framework.
    """
    rest_prefix = 'google'
    endpoint = "configs/conf-google_cloud_billing_inputs"
    requiredArgs = {
        'google_credentials_name',
        'google_project',
        'bucket_name',
        'report_prefix',
        'ingestion_start',
    }
    optionalArgs = {
        'temp_file_folder',
        'bucket_region',
        'polling_interval',
        'index',
        'disabled'
    }
    defaultVals = {
        'polling_interval': '3600',
        'index': 'default',
    }
    validators = {
        'ingestion_start': validator.Datetime('%Y-%m-%d'),
        'polling_interval': validator.Number(min_val=1),
    }
    cap4endpoint = ''
    cap4get_cred = ''


def main():
    admin.init(
        base.ResourceHandler(BillingInputs),
        admin.CONTEXT_APP_AND_USER
    )
