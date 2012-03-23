from flask import *
from sqlobject.sqlbuilder import *
from model import *
import json
import sprockets

app = Flask(__name__)

asset_env = sprockets.Environment('assets', minify=True)

@app.route('/')
def index():
  return open('assets/index.html').read()

@app.route('/search_courses/<query>')
def search(query):
  results = list(Course.select(OR(
    LIKE(Course.q.title, "%%%s%%" % query),
    LIKE(Course.q.description, "%%%s%%" % query)
  )))
  return jsonify(data=map(lambda x: x.get_dict(), results))

@app.route('/assets/<path:asset_path>')
def asset(asset_path):
  try:
    asset = asset_env.get_asset(asset_path)
    resp = make_response(open(asset.path).read(), 200)
    resp.headers['Content-Type'] = asset.mime_type
    return resp
  except sprockets.AssetNotFoundException as e:
    app.logger.error(e.message)
    resp = make_response(e.message, 404)
    resp.headers['Content-Type'] = 'text/plain'
    return resp
  except sprockets.ProcessingException as e:
    app.logger.error(e.message)
    resp = make_response(e.message, 500)
    resp.headers['Content-Type'] = 'text/plain'
    return resp

if __name__ == '__main__':
  app.debug = True
  app.run()
