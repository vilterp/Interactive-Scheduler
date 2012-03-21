from sqlobject import *
import os, sys, json

DB_FILENAME = os.path.abspath('data.db')

# MODELS

class Course(SQLObject):
  title = UnicodeCol()
  description = UnicodeCol()
  notes = UnicodeCol()
  prereq_text = UnicodeCol()
  prereq_json = UnicodeCol()
  credit = UnicodeCol()
  terms_offered = UnicodeCol()
  departments = MultipleJoin('CourseDepartment')
  instructors = MultipleJoin('CourseInstructor')
  
  @staticmethod
  def get_by_code(code):
    """e.g. Course.get_by_code('CMSC 16200')"""
    dept_code = code[:4]
    number = code[-5:]
    # should probably do this in a single query with a join or something...
    dept = Department.selectBy(abbrev=dept_code).getOne()
    return CourseDepartment.selectBy(department=dept, code=number).getOne().course
  
  def get_dict(self):
    # shouldn't have to write this code...
    return {
      'id': self.id,
      'title': self.title,
      'description': self.description,
      'notes': self.notes,
      'prereq_text': self.prereq_text,
      'prereq_json': self.get_prereqs(),
      'credit': self.credit,
      'terms_offered': self.terms_offered,
      'instructors': [ci.instructor.catalog_listed_name for ci in self.instructors]
    }
  
  def get_prereqs(self):
    return json.loads(self.prereq_json) if self.prereq_json else None
  

class CourseInstructor(SQLObject):
  course = ForeignKey('Course')
  instructor = ForeignKey('Instructor')

class CourseDepartment(SQLObject):
  course = ForeignKey('Course')
  department = ForeignKey('Department')
  code = UnicodeCol()

class Instructor(SQLObject):
  catalog_listed_name = UnicodeCol()
  courses_taught = MultipleJoin('CourseInstructor')

class Department(SQLObject):
  name = UnicodeCol()
  abbrev = UnicodeCol()
  listings = MultipleJoin('CourseDepartment')

class Major(SQLObject):
  name = UnicodeCol()
  requirements = UnicodeCol()

# UTILITY METHODS

def create_tables():
  Course.createTable()
  CourseDepartment.createTable()
  Department.createTable()
  CourseInstructor.createTable()
  Instructor.createTable()
  Major.createTable()

def delete_db():
  if os.path.isfile(DB_FILENAME):
    os.remove(DB_FILENAME)

# once this is called, model classes will be connected to db
def setup_connection(debug=False):
  connection_string = 'sqlite:' + DB_FILENAME
  connection = connectionForURI(connection_string, debug=debug)
  sqlhub.processConnection = connection

setup_connection()

if __name__ == '__main__':
  delete_db()
  create_tables()
