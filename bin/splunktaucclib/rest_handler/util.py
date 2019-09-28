
from __future__ import absolute_import

from splunk import admin

try:
    from splunktalib.common import util
except:
    print 'Python Lib for Splunk add-on "splunktalib" is required'
    raise BaseException()


__all__ = ['getBaseAppName', 'makeConfItem']


def getBaseAppName():
    """Base App name, which this script belongs to.
    """
    appName = util.get_appname_from_path(__file__)
    if appName is None:
        raise Exception('Cannot get app name from file: %s' % __file__)
    return appName


def makeConfItem(name, entity, confInfo, user='nobody', app='-'):
    confItem = confInfo[name]
    for key, val in entity.items():
        if key not in ("eai:attributes", "eai:userName", "eai:appName"):
            confItem[key] = val
    confItem["eai:userName"] = entity.get("eai:userName") or user
    confItem["eai:appName"] = entity.get("eai:appName") or app
    confItem.setMetadata(admin.EAI_ENTRY_ACL,
                         entity.get(admin.EAI_ENTRY_ACL) or
                         {'owner': user,
                          'app': app,
                          'global': 1,
                          'can_write': 1,
                          'modifiable': 1,
                          'removable': 1,
                          'sharing': 'global',
                          'perms': {'read': ['*'], 'write': ['admin']}})
    return confItem
