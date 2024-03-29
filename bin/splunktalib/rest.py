from future import standard_library
standard_library.install_aliases()
from builtins import range
from six import string_types
from builtins import object
import urllib.request, urllib.parse, urllib.error
import json
from traceback import format_exc
import sys
import os.path as op
import httplib2_helper
import httplib2shim
from httplib2 import (socks, ProxyInfo, Http)

import splunktalib.common.util as scu
import splunktalib.common.pattern as scp
from splunktalib.common import logger
from future.utils import with_metaclass

def splunkd_request(splunkd_uri, session_key, method="GET", headers=None,
                    data=None, timeout=30, retry=1, http=None):
    """
    :return: httplib2.Response and content
    """

    if http is None:
        return httplib2_request(
            splunkd_uri, session_key, method, headers, data, timeout, retry)
    else:
        return urllib3_request(
            http, splunkd_uri, session_key, method, headers,
            data, timeout, retry)


def httplib2_request(splunkd_uri, session_key, method="GET", headers=None,
                     data=None, timeout=30, retry=1):
    http = Http(timeout=timeout, disable_ssl_certificate_validation=True)

    def httplib2_req(splunkd_uri, method, headers, data, timeout):
        resp, content = http.request(
            splunkd_uri, method=method, headers=headers, body=data)
        return resp, content

    return do_splunkd_request(splunkd_uri, session_key, method, headers,
                              data, timeout, retry, httplib2_req)


def urllib3_request(http, splunkd_uri, session_key, method="GET",
                    headers=None, data=None, timeout=30, retry=1):
    """
    use urllib3, http can be connection pooling manager
    :return: HTTPSResponse and content
    """

    def urllib3_req(splunkd_uri, method, headers, data, timeout):
        resp = http.request(method, splunkd_uri, body=data, headers=headers,
                            retries=1, timeout=timeout, release_conn=False,
                            preload_content=True)
        content = resp.data
        return resp, content

    return do_splunkd_request(splunkd_uri, session_key, method, headers,
                              data, timeout, retry, urllib3_req)


def do_splunkd_request(splunkd_uri, session_key, method, headers,
                       data, timeout, retry, http_req):
    headers = headers if headers is not None else {}
    headers["Connection"] = "keep-alive"
    headers["User-Agent"] = "curl/7.29.0"
    if session_key:
        if not session_key.startswith('Splunk'):
            session_key = "Splunk {0}".format(session_key)
        headers["Authorization"] = session_key
    content_type = headers.get("Content-Type")
    if not content_type:
        content_type = headers.get("content-type")

    if not content_type:
        content_type = "application/x-www-form-urlencoded"
        headers["Content-Type"] = content_type

    if data is not None and not isinstance(data, string_types):
        if content_type == "application/json":
            data = json.dumps(data)
        else:
            data = urllib.parse.urlencode(data)

    msg_temp = "Failed to send rest request=%s, errcode=%s, reason=%s"
    resp, content = None, None
    for _ in range(retry):
        try:
            resp, content = http_req(splunkd_uri, method, headers,
                                     data, timeout)
        except Exception:
            logger.error(msg_temp, splunkd_uri, "unknown", format_exc())
        else:
            if resp.status not in (200, 201):
                if method != "GET" and resp.status != 404:
                    logger.error(msg_temp, splunkd_uri, resp.status,
                                 code_to_msg(resp, content))
            else:
                break

    return resp, content


def code_to_msg(resp, content):
    code_msg_tbl = {
        400: "Request error. reason={}".format(content),
        401: "Authentication failure, invalid access credentials.",
        402: "In-use license disables this feature.",
        403: "Insufficient permission.",
        404: "Requested endpoint does not exist.",
        409: "Invalid operation for this endpoint. reason={}".format(content),
        500: "Unspecified internal server error. reason={}".format(content),
        503: ("Feature is disabled in the configuration file. "
              "reason={}".format(content)),
    }

    return code_msg_tbl.get(resp.status, content)


def build_http_connection(config, timeout=120, disable_ssl_validation=False):
    """
    :config: dict like, proxy and account information are in the following
             format {
                 "username": xx,
                 "password": yy,
                 "proxy_url": zz,
                 "proxy_port": aa,
                 "proxy_username": bb,
                 "proxy_password": cc,
                 "proxy_type": http,http_no_tunnel,sock4,sock5,
                 "proxy_rdns": 0 or 1,
             }
    :return: Http2.Http object
    """

    proxy_type_to_code = {
        "http": socks.PROXY_TYPE_HTTP,
        "http_no_tunnel": socks.PROXY_TYPE_HTTP_NO_TUNNEL,
        "socks4": socks.PROXY_TYPE_SOCKS4,
        "socks5": socks.PROXY_TYPE_SOCKS5,
    }
    if config.get("proxy_type") in proxy_type_to_code:
        proxy_type = proxy_type_to_code[config["proxy_type"]]
    else:
        proxy_type = socks.PROXY_TYPE_HTTP

    rdns = scu.is_true(config.get("proxy_rdns"))

    proxy_info = None
    if config.get("proxy_url") and config.get("proxy_port"):
        if config.get("proxy_username") and config.get("proxy_password"):
            proxy_info = ProxyInfo(proxy_type=proxy_type,
                                   proxy_host=config["proxy_url"],
                                   proxy_port=int(config["proxy_port"]),
                                   proxy_user=config["proxy_username"],
                                   proxy_pass=config["proxy_password"],
                                   proxy_rdns=rdns)
        else:
            proxy_info = ProxyInfo(proxy_type=proxy_type,
                                   proxy_host=config["proxy_url"],
                                   proxy_port=int(config["proxy_port"]),
                                   proxy_rdns=rdns)
    if proxy_info:
        # Creating Http object from httplib2shim library which is a wrapper over httplib2 library. This code is added since
        # the configuration of inputs failed when proxy is enabled on the instance.
        http = httplib2shim.Http(proxy_info=proxy_info,
                             timeout=timeout,
                             disable_ssl_certificate_validation=disable_ssl_validation)
    else:
        # Creating Http object from httplib2shim library which is a wrapper over httplib2 library. This code is added since
        # the configuration of inputs failed when proxy is enabled on the instance.
        http = httplib2shim.Http(timeout=timeout,
                             disable_ssl_certificate_validation=disable_ssl_validation)

    if config.get("username") and config.get("password"):
        http.add_credentials(config["username"], config["password"])
    return http


class HttpPoolManager(with_metaclass(scp.SingletonMeta, object)):

    import urllib3
    urllib3.disable_warnings()

    def __init__(self, config):
        maxsize = int(config.get("max_pool_size", 70))
        self._pool = self.urllib3.PoolManager(maxsize=maxsize)

    def pool(self):
        return self._pool
