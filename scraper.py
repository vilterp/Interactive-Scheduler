from BeautifulSoup import BeautifulSoup, NavigableString
import sys
import urllib
import re
import codecs
import pprint
import logging
import json
from model import *
from prereqparse import *

# TODO: scrape instructor

logging.getLogger().setLevel(logging.INFO)

def read_url(url):
  f = urllib.urlopen(url)
  return f.read()

def get_all_majors():
  logging.info('scraping list of majors...')
  url = 'http://collegecatalog.uchicago.edu/thecollege/programsofstudy/'
  doc = BeautifulSoup(read_url(url))
  major_links = doc.find('ul', {'class':'menu'}).li.ul.li.ul.findAll('a')
  link_map = {}
  for a in major_links:
    link_map[a.text] = 'http://collegecatalog.uchicago.edu' + a['href']
  return link_map

def trace(thing):
  print thing

# url -> [Course Dict]
def get_courses(url):
  doc = BeautifulSoup(read_url(url))
  course_elems = doc.findAll('div', {'class': 'courseblock main'})
  course_elems.extend(doc.findAll('div', {'class': 'courseblock subsequence'}))
  courses = []
  for course_elem in course_elems:
    title_text = course_elem.find('p', {'class':'courseblocktitle'}).strong.text\
                            .replace('&#160;', ' ').replace(u'\xa0', ' ')
    m = re.search(r'([A-Z]{4} [0-9]{5})\.\s+(.*)\.\s+([0-9]+)\s+Units\.', title_text)
    if not m:
      logging.info('\tskipping "%s" (header of a sequence)' % title_text)
    else:
      code, title, credit = m.groups()
      desc = course_elem.find('p', {'class': 'courseblockdesc'}).text
      # get details
      details = course_elem.find('p', {'class': 'courseblockdetail'})
      texts = [x.strip() for x in details.contents if x.__class__ == NavigableString]
      prereq_text = None
      notes = None
      terms_offered = None
      for text in texts:
        # scrape rereqs
        m = re.search(r'Prerequisite\(s\): (.*)', text)
        if m:
          prereq_text = m.group(1)
        # scrape notes
        m = re.search(r'Note\(s\): (.*)', text)
        if m:
          notes = m.group(1)
        # scrape terms offered
        m = re.search(r'Terms Offered: (.*)', text)
        if m > 0:
          terms_offered = m.group(1)
      course = {
        'code': code,
        'title': title,
        'prereq_text': prereq_text,
        'notes': notes,
        'desc': desc,
        'terms_offered': terms_offered,
        'credit': credit
      }
      courses.append(course)
      logging.info('\tscraped course %s' % title)
  return courses

# () -> Map[Major, [Course dict]]
def get_all_courses():
  all_courses = {}
  for major, url in get_all_majors().iteritems():
    logging.info('Scraping %s...' % major)
    all_courses[major] = get_courses(url)
  return all_courses

def get_all_courses_cached():
  courses = None
  try:
    courses = read_courses()
  except IOError:
    courses = get_all_courses()
    write_courses(courses)
  return courses

def write_courses(courses):
  f = open('courses.py', 'w')
  f.write(pprint.pformat(courses))
  f.close()

def read_courses():
  f = open('courses.py')
  return eval(f.read())

def insert_into_db(courses):
  logging.info('inserting course data into db...')
  for major, courses in courses.iteritems():
    # if all the department codes (e.g. "MATH", "ENGL") listed in this major are the same,
    # we assume that the department code can be associated with the major name
    # e.g. MATH <=> Mathematics
    major_codes = [course['code'][:4] for course in courses]
    major_name = None
    if len(major_codes) > 0:
      if all([x == major_codes[0] for x in major_codes]):
        major_name = major
    for course_dict in courses:
      # create department record (without name)
      course_code = course_dict['code'] # eg CMSC 16100
      dept_code = course_code[:4]
      res = list(Department.selectBy(abbrev=dept_code))
      assert len(res) == 0 or len(res) == 1
      if len(res) == 1:
        dept = res[0]
      elif len(res) == 0:
        dept = Department(abbrev=dept_code, name=major_name) # this will save automatically to db
      # create course record
      print course_dict
      res1 = list(Course.selectBy(title=course_dict['title'],
                                  description=course_dict['desc'],
                                  prereq_text=course_dict['prereq_text']))
      assert len(res1) == 0 or len(res1) == 1
      if len(res1) == 0:
        # create new course record if not in db
        course = Course(title=course_dict['title'],
                        notes=course_dict['notes'],
                        description=course_dict['desc'],
                        prereq_text=course_dict['prereq_text'],
                        prereq_json=prereqtext_to_json(course_dict['prereq_text']) if course_dict['prereq_text'] else None,
                        terms_offered=course_dict['terms_offered'],
                        credit=course_dict['credit'])
      elif len(res1) == 1:
        course = res1[0]
      # create Code record to link course to department
      Code(course=course, department=dept, code=course_code[-5:])

def clear_db():
  logging.info('clearing db')
  Department.deleteBy()
  Course.deleteBy()
  Code.deleteBy()

if __name__ == '__main__':
  clear_db()
  cs = get_all_courses_cached()
  insert_into_db(cs)
