import re
import string

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

def hasCourses(s):
  return re.search('\d\d\d\d\d', s) is not None

def consentReq(s):
  res = re.search('[Cc]onsent.*', s)
  try:
    return res.group()
  except AttributeError:
    return None

def sequenceParse(s, dept):
  res = re.search('\d\d\d\d\d$', s)
  if res:
    coursenumber = res.group()
    return ' '.join([dept, coursenumber])
  else:
    return None

#prereqs = []
#for major, classes in courses.iteritems():
#  for cl in classes:
#    prereqs += [cl['prereq_text']]

def parse_prereq(s):
  if not hasCourses(s):
    return [s]
  else:
    prereqs = re.split('and|;', s)
    prereqs = [re.split(' or|,|/', req) for req in prereqs]
    newprereqs = []

    for group in prereqs:
      dept = group[0].strip()[:4]
      firstelt = group[0].strip()

      if '-' in firstelt:
        firstelt = sequenceParse(firstelt, dept)

      newgroup = [firstelt]

      for equivalent in group[1:]:
        consentres = consentReq(equivalent)

        if consentres:
          newgroup.append(equivalent)
        else:
          if '-' in equivalent:
            equivalent = sequenceParse(equivalent, dept)
            newgroup.append(equivalent)
          else:
            equivalent = re.search('\d\d\d\d\d', equivalent)

            if equivalent:
              equivalent = ' '.join([dept, equivalent.group()])
              newgroup.append(equivalent)

      newprereqs.append(newgroup)

    return newprereqs
      # first split at 'and' ';' (maybe ',', although this interferes with ors)
    #prereqs = re.findall('.... [0-9][0-9][0-9][0-9][0-9]',s)
