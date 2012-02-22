import re
import string
import json

# Dropbox version

# this is hard:
# 'BIOS 20182, 20192, or 20187 and consent of Instructor.'
# a course is a bin. if there are no prereqs, it has num=1
# else its prereqs are courses or bins (bins are for or relations)

# coursenum/coursenum is an or relation
# courses with consent/other special reqs should be in yellow

# if a phrase contains an 'or', split by commas
# check for phrase "recommended"

# 'plus' is kind of like 'and' but it's only used 3 times
# so we can do that by hand

def num_reqs(reqs):
  res = 0
  for req in reqs:
    if type(req) is str:
      res += 1
    else:
      res += num_reqs(req)
  return res

def dept_of_course(s):
  try:
    return re.search('^[a-zA-Z]{4}', s).group()
  except AttributeError:
    return None

def hasCourses(s):
  return re.search('\d{5}', s) is not None

def consentReq(s):
  res = re.search('[Cc]onsent.*', s)
  try:
    return res.group()
  except AttributeError:
    return None

# dept is needed because sequence strings sometimes have no departments attached
def sequenceParse(s, dept):
  res = re.search('\d{5}$', s)
  if res:
    coursenumber = res.group()
    return '{0} {1}'.format(dept, coursenumber)
  else:
    return None    

#prereqs = []
#for major, classes in courses.iteritems():
#  for cl in classes:
#    prereqs += [cl['prereq_text']]

def parse_preq(s):
  if not hasCourses(s):
    return [s]
  else:
    prereqs    = re.split('and|;', s)
    prereqs    = [re.split(' or|,|/', req) for req in prereqs]
    default_dept = prereqs[0][0].strip()[:4]
    newprereqs = []

    for group in prereqs:
      group_default = group[0].strip()[:4]
      print default_dept
      newgroup = []
      for equivalent in group:
        consentres = consentReq(equivalent)
        indiv_dept = dept_of_course(equivalent.strip())

        if consentres:
          newgroup.append(equivalent)
        elif '-' in equivalent:
          # there's some minor but necessary code duplication here with the
          # next elif branch. Maybe will pull out as a function but this is 
          # pretty clear
          if indiv_dept:      dept = indiv_dept
          elif group_default: dept = group_default
          else:               dept = default_dept
          equivalent = sequenceParse(equivalent, dept)
          newgroup.append(equivalent)
        else:
          coursenum = re.search('\d{5}', equivalent)
          if coursenum:
            if indiv_dept:      dept = indiv_dept
            elif group_default: dept = group_default
            else:               dept = default_dept
            equivalent = '{0} {1}'.format(dept, coursenum.group())
            newgroup.append(equivalent)
      newprereqs.append(newgroup)
    return newprereqs


def prereqs_to_bin(prereqs):
  andbin = {}
  andbin['num'] = len(prereqs)
  andbin['list'] = []
  for orgroup in prereqs:
    orbin = {}
    orbin['num']  = 1
    orbin['list'] = [x for x in orgroup]
    andbin['list'].append(orbin)
  return andbin

def prereqtext_to_json(s):
  return json.dumps(prereqs_to_bin(parse_preq(s)))
