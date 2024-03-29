from builtins import object
import os.path as op
import traceback

from splunktalib.common import logger


class FileMonitor(object):

    def __init__(self, callback, files):
        """
        :files: files to be monidtored with full path
        """

        self._callback = callback
        self._files = files

        self.file_mtimes = {
            file_name: None for file_name in self._files
        }
        for k in self.file_mtimes:
            try:
                self.file_mtimes[k] = op.getmtime(k)
            except OSError:
                logger.debug("Getmtime for %s, failed: %s",
                             k, traceback.format_exc())

    def __call__(self):
        self.check_changes()

    def check_changes(self):
        logger.debug("Checking files=%s", self._files)
        file_mtimes = self.file_mtimes
        changed_files = []
        for f, last_mtime in file_mtimes.items():
            try:
                current_mtime = op.getmtime(f)
                if current_mtime != last_mtime:
                    file_mtimes[f] = current_mtime
                    changed_files.append(f)
                    logger.info("Detect %s has changed, last=%s, current=%s",
                                f, last_mtime, current_mtime)
            except OSError:
                pass

        if changed_files:
            if self._callback:
                self._callback(changed_files)
            return True
        return False
