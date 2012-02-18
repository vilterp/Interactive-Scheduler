import os, json, sys, logging
from model import *

# running this script reads the major req specifications in major_reqs directory,
# parses, them, resolves course specs (e.g. "CMSC 16100") into id numbers,
# and puts the resolved JSON into the db in the majors table, to be used by our
# app. Not sure if this is the best way to do it.... get_course_by_code function
# is useful though.

logging.getLogger().setLevel(logging.INFO)

major_reqs_dir = os.path.abspath('major_reqs')

def get_course_by_code(code):
  dept_code = code[:4]
  number = code[-5:]
  # definitely a more elegant way to do this...
  dept = Department.selectBy(abbrev=dept_code)[0]
  codes = list(Code.selectBy(department=dept, code=number))
  if len(codes) == 1:
    return codes[0].course
  else:
    raise Exception('course not found: %s', code)

# [Bin or Course] -> [Bin or Course with course ids instead of codes]
def transform_reqs(requirement):
  if type(requirement) is unicode:
    return get_course_by_code(requirement).id
  elif type(requirement) is dict:
    d = {
          'num': requirement['num'],
          'list': transform_reqs(requirement['list'])
        }
    try:
      d['title'] = requirement['title']
    except KeyError:
      pass
    return d
  elif type(requirement) is list:
    return map(transform_reqs, requirement)


if __name__ == '__main__':
  Major.deleteBy() # clear old ones
  for entry in os.listdir(major_reqs_dir):
    f = open(os.path.join(major_reqs_dir, entry))
    obj = json.load(f)
    logging.info('processing reqs for %s' % obj['name'])
    processed = transform_reqs(obj['requirements'])
    Major(name=obj['name'], requirements=json.dumps(processed))
