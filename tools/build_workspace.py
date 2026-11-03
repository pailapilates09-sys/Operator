#!/usr/bin/env python3
"""Compatibility entrypoint for the staff pages."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('build_staff_site.py')),run_name='__main__')
