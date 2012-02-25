from flask import *
from sqlobject.sqlbuilder import *
from model import *
import json

app = Flask(__name__)

@app.route('/')
def index():
  return open('static/index.html').read()

@app.route('/search_courses/<query>')
def search(query):
  results = list(Course.select(OR(
    LIKE(Course.q.title, "%%%s%%" % query),
    LIKE(Course.q.description, "%%%s%%" % query)
  )))
  def make_dict(c):
    return {
       'title': c.title,
       'description': c.description,
       'prereqs': c.get_prereqs(),
       'prereq_text': c.prereq_text,
       'notes': c.notes,
       'terms_offered': c.terms_offered
     }
  return jsonify(data=map(make_dict, results))

if __name__ == '__main__':
  app.debug = True
  app.run()
