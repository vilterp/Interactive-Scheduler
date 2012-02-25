import os, os.path, json, sys
from model import *
from sqlobject.main import SQLObjectNotFound

# dict -> dict
# returns bin tree, with course designator strings (e.g. "CMSC 16200") expanded
# to full course dictionaries
def expand_courses(req):
  if type(req) is unicode:
    return Course.get_by_code(req).get_dict()
  elif type(req) is dict:
    return {
      'title': req.get('title'), # defaults to None
      'num': req['num'],
      'list': filter(lambda x: x, map(expand_courses, req['list']))
    }


if __name__ == '__main__':
  if len(sys.argv) is not 3:
    print 'Usage: %s [specification dir] [output dir]' % sys.argv[0]
    sys.exit(-1)
  indir = sys.argv[1]
  outdir = sys.argv[2]
  for fname in os.listdir(indir):
    in_path = os.path.join(indir, fname)
    out_path = os.path.join(outdir, fname)
    initial = json.load(open(in_path))
    transformed = expand_courses(initial)
    json.dump(transformed, open(out_path, 'w'), indent=True)
    print '%s => %s' % (in_path, out_path)
