"""
This module is used to filter and reload PATH.
"""

import os
import os.path
import re
import sys
import types
import logging


def setup_python_path():
    # Exclude folder beneath other apps, Fix bug for rest_handler.py
    ta_name = os.path.basename(os.path.dirname(os.path.dirname(__file__)))
    pattern = re.compile(r"[\\/]etc[\\/]apps[\\/][^\\/]+[\\/]bin[\\/]?$")
    new_paths = [path for path in sys.path if not pattern.search(path) or ta_name in path]
    new_paths.insert(0, os.path.dirname(__file__))
    sys.path = new_paths

    bindir = os.path.dirname(os.path.abspath(__file__))
    # We sort the precedence in a decending order since sys.path.insert(0, ...)
    # do the reversing.
    # Insert library folder
    sitedir = os.path.join(bindir, '3rdparty')
    sys.path.insert(0, sitedir)
    load_google_cloud_package(sitedir)


def load_google_cloud_package(sitedir):
    def _load_virtual_package(*path):
        folder = os.path.join(sitedir, *path)
        if not os.path.isdir(folder):
            return
        name = '.'.join(path)
        package = sys.modules.setdefault(name, types.ModuleType(name))
        package.__dict__.setdefault('__path__', [folder])
        if len(path) > 1:
            pname = '.'.join(path[:-1])
            mname = path[-1]
            setattr(sys.modules[pname], mname, package)

    _load_virtual_package('google')
    _load_virtual_package('google', 'iam')
    _load_virtual_package('google', 'logging')
    _load_virtual_package('google', 'cloud')
    _load_virtual_package('google', 'cloud', 'gapic')
    _load_virtual_package('google', 'cloud', 'gapic', 'pubsub')
    _load_virtual_package('google', 'cloud', 'proto')
    _load_virtual_package('google', 'cloud', 'proto', 'pubsub')


def run_module(name):
    setup_python_path()
    instance = __import__(name, fromlist=['main'])
    instance.main()


# preventing splunklib initialize an unexpected root handler
def run_rest_handler(name):
    logging.root.addHandler(logging.NullHandler())
    run_module(name)

# We have to create virtual packages for google library again on Windows
# Because the global state would not be inherited 
if os.name == 'nt':
    setup_python_path()


