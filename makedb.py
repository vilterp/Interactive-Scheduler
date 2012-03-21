from scraper import *
import model
import sys

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
      # get or create department record (without name)
      course_code = course_dict['code'] # eg CMSC 16100
      dept_code = course_code[:4]
      dept = Department.selectBy(abbrev=dept_code).getOne(None)
      if not dept:
        logging.info('creating department %s' % dept_code)
        dept = Department(abbrev=dept_code, name=major_name) # this will save automatically to db
      # create course record
      course_res = list(Course.selectBy(title=course_dict['title'],
                                        description=course_dict['desc'],
                                        prereq_text=course_dict['prereq_text']))
      assert len(course_res) == 0 or len(course_res) == 1
      if len(course_res) == 0:
        # create new course record if not in db
        logging.info('creating course %s' % course_dict['title'])
        course = Course(title=course_dict['title'],
                        notes=course_dict['notes'],
                        description=course_dict['desc'],
                        prereq_text=course_dict['prereq_text'],
                        prereq_json=prereqtext_to_json(course_dict['prereq_text']) if course_dict['prereq_text'] else None,
                        terms_offered=course_dict['terms_offered'],
                        credit=course_dict['credit'])
      elif len(course_res) == 1:
        # course record is already in db
        course = course_res[0]
      # link to instructors, creating new instructor records if necessary
      for inst in course_dict['instructors']:
        instructor = Instructor.selectBy(catalog_listed_name=inst).getOne(None)
        if not instructor:
          # create a new instructor record if not found
          logging.info('creating instructor %s' % inst)
          instructor = Instructor(catalog_listed_name=inst)
        # create joining record
        CourseInstructor(course=course, instructor=instructor)
      # create CourseDepartment record to link course to department
      CourseDepartment(course=course, department=dept, code=course_code[-5:])


def reset_db():
  logging.info('blowing away db')
  delete_db()
  create_tables()

if __name__ == '__main__':
  if len(sys.argv) != 2:
    print 'usage: python %s [cache file]' % sys.argv[0]
  else:
    reset_db()
    cs = read_courses(sys.argv[1])
    insert_into_db(cs)
