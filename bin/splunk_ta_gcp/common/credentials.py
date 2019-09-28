import json
from google.oauth2 import service_account
from google.auth import compute_engine

class CredentialFactory(object):
    def __init__(self, config):
        self._config = config

    def load(self, profile, scopes):
        collection = 'splunk_ta_google/google_credentials'
        content = self._config.load(collection, stanza=profile, virtual=True)
        key = content['google_credentials']
        info = json.loads(key)

        if not bool(info): # bool(dict) evaluates to False if empty
            return compute_engine.Credentials()
            
        return service_account.Credentials.from_service_account_info(info, scopes=scopes)
