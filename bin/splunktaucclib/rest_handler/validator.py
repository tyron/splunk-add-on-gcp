"""
Validators for Splunk configuration.
"""

from __future__ import absolute_import

import sys
from builtins import str
from builtins import object
import re
import json
from inspect import isfunction

basestring = str if sys.version_info[0] == 3 else basestring

__all__ = [
    'Validator', 'ValidationError', 'AnyOf', 'AllOf', 'RequiresIf',
    'UserDefined', 'Enum', 'Number', 'String', 'Pattern', 'Host', 'Port',
    'Datetime', 'Email', 'JsonString',
]


class Validator(object):
    """
    Base class of validators.
    """

    def __init__(self):
        # Validation error message pool
        self._msgs = []

    def validate(self, value, data):
        """
        Check if the given value is valid. It assumes that
        the given value is a string.

        :param value: value to validate.
        :param data: whole payload in request.
        :return If the value is invalid, return True. Or return False.
        """
        raise NotImplementedError(
            'Function "validate" needs to be implemented.'
        )

    @property
    def msg(self):
        """
        It will return the one with highest priority.

        :return:
        """
        return self._msgs[0] if self._msgs else 'Invalid input value'

    def put_msg(self, msg, high_priority=False):
        """
        Put message content into pool.

        :param msg: error message content
        :param high_priority: is this message with high priority
        :return:
        """
        self._msgs.insert(0, msg) if high_priority else self._msgs.append(msg)


class ValidationFailed(Exception):
    """
    Validation error.
    """
    pass


class AnyOf(Validator):
    """
    A composite of validators that accepts values accepted by
    any of its component validators.
    """

    def __init__(self, *validators):
        """

        :param validators: A list of validators.
        """
        super(AnyOf, self).__init__()
        self._validators = validators

    def validate(self, value, data):
        msgs = []
        for validator in self._validators:
            if not validator.validate(value, data):
                msgs.append(validator.msg)
            else:
                return True
        else:
            self.put_msg(
                'At least one of the following errors/suggestions '
                'need to be fixed: %s' % json.dumps(msgs)
            )
            return False


class AllOf(Validator):
    """
    A composite of validators that accepts values accepted by
    all of its component validators.
    """

    def __init__(self, *validators):
        """

        :param validators: A list of validators.
        """
        super(AllOf, self).__init__()
        self._validators = validators

    def validate(self, value, data):
        msgs = []
        for validator in self._validators:
            if not validator.validate(value, data):
                msgs.append(validator.msg)
        if msgs:
            self.put_msg(
                'All of the following errors/suggestions '
                'need to be fixed: %s' % json.dumps(msgs)
            )
            return False
        return True


class RequiresIf(Validator):
    """
    If the given field makes the specified condition as True,
    it requires some other fields are not empty in the payload of request.
    """

    def __init__(self, fields, condition=None):
        """

        :param fields: conditionally required field name list.
        :param condition: it can be:
            1. None means any non-empty string for given field makes it True
            2. A function takes value & data as parameters and
               return a boolean value
        """
        assert isinstance(fields, (list, set, tuple)), \
            'Argument "fields" should be list, set or tuple'
        super(RequiresIf, self).__init__()
        self.fields = fields
        self.condition = condition

    def validate(self, value, data):
        if self.condition is None and (value is not None and value != ''):
            need_validate = True
        else:
            assert isfunction(self.condition), \
                'Condition should be a function for RequiresIf validator'
            need_validate = self.condition(value, data)
        if not need_validate:
            return True

        fields = []
        for field in self.fields:
            val = data.get(field, None)
            if val is None or val == '':
                fields.append(field)
        if fields:
            self.put_msg(
                'For given input, fields are required: %s' % ', '.join(fields)
            )
            return False
        return True


class UserDefined(Validator):
    """
    A validator that defined by user.

    The user-defined validator function should be in form:
    ``def func(value, data, *args, **kwargs): ...``
    ValidationFailed will be raised if validation failed.

    Usage::
    >>> def my_validate(value, data, args):
    >>>     if value != args or not data:
    >>>         raise ValidationFailed('Invalid input')
    >>>
    >>> my_validator = UserDefined(my_validate, 'test_val')
    >>> my_validator.validate('value', {'key': 'value'}, 'value1')

    """

    def __init__(self, validator, *args, **kwargs):
        """

        :param validator: user-defined validating function
        """
        super(UserDefined, self).__init__()
        self._validator, self._args, self._kwargs = validator, args, kwargs

    def validate(self, value, data):
        try:
            self._validator(value, data, *self._args, **self._kwargs)
        except ValidationFailed as exc:
            self.put_msg(str(exc))
            return False
        else:
            return True


class Enum(Validator):
    """
    A validator that accepts only a finite set of values.
    """

    def __init__(self, values=()):
        """

        :param values: The collection of valid values
        """
        super(Enum, self).__init__()
        try:
            self._values = set(values)
        except TypeError:
            self._values = list(values)
        self._msg = 'Value should be in ' \
                    ''.format(json.dumps(list(self._values)))

    def validate(self, value, data):
        return value in self._values


class Number(Validator):
    """
    A validator that accepts values within in a certain range.
    This is for numeric value.

    Accepted condition: min_val <= value < max_val
    """

    def __init__(self, min_val=None, max_val=None, is_int=False):
        """

        :param min_val: if not None, it requires min_val <= value
        :param max_val: if not None, it requires value < max_val
        :param is_int: the value should be integer or not
        """
        def check(val):
            try:
                return val is None or isinstance(val, (int, long, float))
            except NameError:
                return val is None or isinstance(val, (int, float))
        assert check(min_val) and check(max_val), \
            '``min_val`` & ``max_val`` should be numbers'

        super(Number, self).__init__()
        self._min_val, self._max_val, self._is_int = min_val, max_val, is_int

    def validate(self, value, data):
        try:
            try:
                value = long(value) if self._is_int else float(value)
            except NameError:
                value = int(value) if self._is_int else float(value)
        except ValueError:
            self.put_msg(
                'Invalid format for %s value'
                '' % ('integer' if self._is_int else 'numeric'),
            )
            return False

        msg = None
        if None not in (self._min_val, self._max_val):
            msg = 'Value should be between {} and {}' \
                  ''.format(self._min_val, self._max_val)
        elif self._min_val is not None:
            msg = 'Value should be no smaller than {}'.format(self._min_val)
        elif self._max_val is not None:
            msg = 'Value should be smaller than {}'.format(self._max_val)
        if msg is not None:
            self.put_msg(msg)

        min_val = self._min_val if self._min_val is not None else (value - 1)
        max_val = self._max_val if self._max_val is not None else (value + 1)
        return min_val <= value < max_val


class String(Validator):
    """
    A validator that accepts string values.

    Accepted condition: min_len <= len(value) < max_len
    """

    def __init__(self, min_len=None, max_len=None):
        """

        :param min_len: If not None, it should be shorter than ``min_len``
        :param max_len: If not None, it should be longer than ``max_len``
        """

        def check(val):
            try:
                return val is None or (isinstance(val, (int, long)) and val >= 0)
            except NameError:
                return val is None or (isinstance(val, int) and val >= 0)
        assert check(min_len) and check(max_len), \
            '``min_len`` & ``max_len`` should be non-negative integers'

        super(String, self).__init__()
        self._min_len, self._max_len = min_len, max_len

    def validate(self, value, data):
        if not isinstance(value, basestring):
            self.put_msg('Input value should be string')
            return False

        msg = None
        if None not in (self._min_len, self._max_len):
            msg = 'String length should be between {} and {}' \
                  ''.format(self._min_len, self._max_len)
        elif self._min_len is not None:
            msg = 'String should be no shorter than {}'.format(self._min_len)
        elif self._max_len is not None:
            msg = 'String should be shorter than {}'.format(self._max_len)
        if msg is not None:
            self.put_msg(msg)

        str_len = len(value)
        min_len = self._min_len or (str_len - 1)
        max_len = self._max_len or (str_len + 1)
        return min_len <= value < max_len


class Datetime(Validator):
    """
    Date time validation.
    """
    def __init__(self, datetime_format):
        """

        :param datetime_format: Date time format, e.g. %Y-%m-%dT%H:%M:%S.%f
        """
        super(Datetime, self).__init__()
        self._format = datetime_format

    def validate(self, value, data):
        import datetime
        try:
            datetime.datetime.strptime(value, self._format)
        except ValueError as exc:
            self.put_msg(str(exc))
            return False
        return True


class Pattern(Validator):
    """
    A validator that accepts strings that match a given regular expression.
    """

    def __init__(self, regex, flags=0):
        """

        :param regex: The regular expression (string or compiled)
            to be matched.
        :param flags: flags value for regular expression.
        """
        super(Pattern, self).__init__()
        self._regexp = re.compile(regex, flags=flags)
        self.put_msg('Not matching the pattern: %s' % regex)

    def validate(self, value, data):
        return self._regexp.match(value) and True or False


class Host(Pattern):
    """
    A validator that accepts strings that represent network hostname.
    """
    def __init__(self):
        regexp = (
            r'^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*'
            r'([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$'
        )
        super(Host, self).__init__(regexp, flags=re.I)
        self.put_msg('Invalid hostname', high_priority=True)


class Port(Number):
    """
    Port number.
    """
    def __init__(self):
        super(Port, self).__init__(min_val=0, max_val=65536, is_int=True)
        self.put_msg(
            'Invalid port number, it should be a integer between 0 and 65535',
            high_priority=True,
        )


class Email(Pattern):
    """
    A validator that accepts strings that represent network hostname.
    """

    def __init__(self):
        regexp = (
            r'^[A-Z0-9][A-Z0-9._%+-]{0,63}@'
            r'(?:[A-Z0-9](?:[A-Z0-9-]{0,62}[A-Z0-9])?\.){1,8}[A-Z]{2,63}$'
        )
        super(Email, self).__init__(regexp, flags=re.I)
        self.put_msg('Invalid email address', high_priority=True)


class JsonString(Validator):
    """
    Check if the given value is valid JSON string.
    """

    def validate(self, value, data):
        try:
            json.loads(value)
        except ValueError:
            self.put_msg('Invalid JSON string')
            return False
        return True
