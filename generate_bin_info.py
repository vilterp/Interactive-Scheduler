from model import *
import json

# major name -> JSON
def get_all_info_for_bin(major):
  m = Major.selectBy(name=major)[0]
  reqs = json.loads(m.requirements)
  return json.dumps(transform_reqs(reqs))

# reqs with ids -> reqs with course structs
def transform_reqs(reqs):
  if type(reqs) is int:
    course = Course.get(reqs)
    return {
      'title': course.title
    }
  elif type(reqs) is list:
    return map(transform_reqs, reqs)
  elif type(reqs) is dict:
    return {
      'num': reqs['num'],
      'list': transform_reqs(reqs['list'])
    }
  else:
    print type(reqs)
    raise Exception(reqs)

if __name__ == '__main__':
  print get_all_info_for_bin('Computer Science')
