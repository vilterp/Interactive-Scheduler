from BeautifulSoup import BeautifulSoup, NavigableString
import sys
import requests
import re
import codecs
import pprint
import logging
import json
import htmlentitydefs
from model import *
from prereqparse import *

# FIXME: errors parsing instructor. Lots of irregularities to deal with in scraper...
  # e.g. "Instructor(s): S. Pruett-Jones (even-numbered years), J. Mateo (odd-numbered years)". oy!
# TODO: scrape department names from timeschedules, replacing current kludgy scheme

logging.getLogger().setLevel(logging.INFO)

def read_url(url):
  return unescape(requests.get(url).text).replace(u'\xa0', ' ') # replace non-breaking spaces with spaces

def get_all_majors():
  logging.info('scraping list of majors...')
  url = 'http://collegecatalog.uchicago.edu/thecollege/programsofstudy/'
  doc = BeautifulSoup(read_url(url))
  major_links = doc.find('ul', {'class':'menu'}).li.ul.li.ul.findAll('a')
  link_map = {}
  for a in major_links:
    link_map[a.text] = 'http://collegecatalog.uchicago.edu' + a['href']
  return link_map

# url -> [Course Dict]
def get_courses(url):
  doc = BeautifulSoup(read_url(url))
  course_elems = doc.findAll('div', {'class': 'courseblock main'})
  course_elems.extend(doc.findAll('div', {'class': 'courseblock subsequence'}))
  courses = []
  for course_elem in course_elems:
    title_text = course_elem.find('p', {'class':'courseblocktitle'}).strong.text
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
      instructors = []
      for text in texts:
        # scrape rereqs
        m = re.search(r'Prerequisite\(s\): (.*)', text)
        if m:
          prereq_text = m.group(1)
        # scrape notes
        m = re.search(r'Note\(s\): (.*)', text)
        if m:
          notes = m.group(1)
        # scrape terms offered & instructor (on the same line...)
        m = re.search(r'(Instructor\(s\): (.*))?\s*Terms Offered: (.*)', text)
        if m:
          terms_offered = m.group(3)
          if m.group(2):
            instructors = m.group(2).strip().split(', ')
      course = {
        'code': code,
        'title': title,
        'prereq_text': prereq_text,
        'notes': notes,
        'desc': desc,
        'terms_offered': terms_offered,
        'credit': credit,
        'instructors': instructors
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

def get_all_courses_cached(cachefile):
  courses = None
  try:
    courses = read_courses(cachefile)
  except IOError:
    courses = get_all_courses()
    write_courses(courses, cachefile)
  return courses

def write_courses(courses, cachefile):
  f = open(cachefile, 'w')
  f.write(pprint.pformat(courses))
  f.close()

def read_courses(cachefile):
  f = open(cachefile)
  return eval(f.read())

# from http://effbot.org/zone/re-sub.htm#unescape-html
##
# Removes HTML or XML character references and entities from a text string.
#
# @param text The HTML (or XML) source text.
# @return The plain text, as a Unicode string, if necessary.
def unescape(text):
  def fixup(m):
    text = m.group(0)
    if text[:2] == "&#":
      # character reference
      try:
        if text[:3] == "&#x":
          return unichr(int(text[3:-1], 16))
        else:
          return unichr(int(text[2:-1]))
      except ValueError:
        pass
    else:
      # named entity
      try:
        text = unichr(htmlentitydefs.name2codepoint[text[1:-1]])
      except KeyError:
        pass
    return text # leave as is
  return re.sub("&#?\w+;", fixup, text)

if __name__ == '__main__':
  if len(sys.argv) == 2:
    write_courses(get_all_courses(), sys.argv[1])
  else:
    print 'usage: python %s [cache file]'
