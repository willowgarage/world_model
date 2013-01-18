#!/usr/bin/env python

from distutils.core import setup
from catkin_pkg.python_setup import generate_distutils_setup

d = generate_distutils_setup(
    scripts=['scripts/map_listener', 'scripts/robot_listener', 'scripts/room_listener'],
)

setup(**d)