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
  return jsonify(data=map(lambda x: x.get_dict(), results))

if __name__ == '__main__':
  app.debug = True
  app.run()
