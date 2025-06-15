import os

destination = os.environ["HOME"]
if len(dest) > 1:
    destination = dest

os.chdir(destination)
os.getcwd()
