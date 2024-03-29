"""
Data Loader main entry point
"""


from future import standard_library
standard_library.install_aliases()
from builtins import object
import queue
import os.path as op
import configparser

import splunktalib.concurrent.concurrent_executor as ce
import splunktalib.timer_queue as tq
import splunktalib.schedule.job as sjob
from splunktalib.common import logger



class TADataLoader(object):
    """
    Data Loader boots all underlying facilities to handle data collection
    """

    def __init__(self, meta_configs, job_scheduler, event_writer):
        """
        @configs: a list like object containing a list of dict
        like object. Each element shall implement dict.get/[] like interfaces
        to get the value for a key.
        @job_scheduler: schedulering the jobs. shall implement get_ready_jobs
        @event_writer: write_events
        """

        self._settings = self._read_default_settings()
        self._meta_configs = meta_configs
        self._event_writer = event_writer
        self._wakeup_queue = queue.Queue()
        self._scheduler = job_scheduler
        self._timer_queue = tq.TimerQueue()
        self._executor = ce.ConcurrentExecutor(self._settings)
        self._started = False

    def run(self, jobs):
        if self._started:
            return
        self._started = True

        self._event_writer.start()
        self._executor.start()
        self._timer_queue.start()
        self._scheduler.start()
        logger.info("TADataLoader started.")

        def _enqueue_io_job(job):
            job_props = job.get_props()
            real_job = job_props["real_job"]
            self.run_io_jobs((real_job,))

        for job in jobs:
            j = sjob.Job(_enqueue_io_job, {"real_job": job},
                         job.get_interval())
            self._scheduler.add_jobs((j,))

        self._wait_for_tear_down()

        for job in jobs:
            job.stop()

        self._scheduler.tear_down()
        self._timer_queue.tear_down()
        self._executor.tear_down()
        self._event_writer.tear_down()
        logger.info("DataLoader stopped.")

    def _wait_for_tear_down(self):
        wakeup_q = self._wakeup_queue
        while 1:
            try:
                go_exit = wakeup_q.get(timeout=1)
            except queue.Empty:
                pass
            else:
                if go_exit:
                    logger.info("DataLoader got stop signal")
                    self._stopped = True
                    break

    def tear_down(self):
        self._wakeup_queue.put(True)
        logger.info("DataLoader is going to stop.")

    def stopped(self):
        return self._stopped

    def run_io_jobs(self, jobs, block=True):
        self._executor.enqueue_io_funcs(jobs, block)

    def run_compute_job(self, func, args=(), kwargs={}):
        self._executor.run_compute_func_sync(func, args, kwargs)

    def run_compute_job_async(self, func, args=(), kwargs={}, callback=None):
        """
        @return: AsyncResult
        """

        return self._executor.run_compute_func_async(func, args,
                                                     kwargs, callback)

    def add_timer(self, callback, when, interval):
        return self._timer_queue.add_timer(callback, when, interval)

    def remove_timer(self, timer):
        self._timer_queue.remove_timer(timer)

    def write_events(self, events):
        self._event_writer.write_events(events)

    @staticmethod
    def _read_default_settings():
        cur_dir = op.dirname(op.abspath(__file__))
        setting_file = op.join(cur_dir, "setting.conf")
        parser = configparser.ConfigParser()
        parser.read(setting_file)
        settings = {}
        keys = ("process_size", "thread_min_size", "thread_max_size",
                "task_queue_size")
        for option in keys:
            try:
                settings[option] = parser.get("global", option)
            except configparser.NoOptionError:
                settings[option] = -1

            try:
                settings[option] = int(settings[option])
            except ValueError:
                settings[option] = -1
        logger.debug("settings: %s", settings)
        return settings


class GlobalDataLoader(object):
    """ Singleton, inited when started"""

    __instance = None

    @staticmethod
    def get_data_loader(meta_configs, scheduler, writer):
        if GlobalDataLoader.__instance is None:
            GlobalDataLoader.__instance = TADataLoader(
                meta_configs, scheduler, writer)
        return GlobalDataLoader.__instance

    @staticmethod
    def reset():
        GlobalDataLoader.__instance = None


def create_data_loader(meta_configs):
    """
    create a data loader with default event_writer, job_scheudler
    """

    import splunktalib.event_writer as ew
    import splunktalib.schedule.scheduler as sched

    writer = ew.EventWriter()
    scheduler = sched.Scheduler()
    loader = GlobalDataLoader.get_data_loader(meta_configs, scheduler, writer)
    return loader
