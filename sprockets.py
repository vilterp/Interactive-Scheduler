import sys, subprocess, os, os.path, tempfile, shutil
import re
import logging
import mimetypes

# TODO: provide easy Flask integration (blueprint?)
# TODO: include paths should be relative
# FIXME: probably breaks if you create new directory structure. should really just create dirs on copy.
# FIXME: how to make processing errors block out the whole action, Play-style? probably not feasible.
# FIXME: how to recompile assets when files they require change? Sprockets actually creates a depgraph (...)

class ProcessedAsset:
  
  def __init__(self, path):
    self.mime_type = mimetypes.guess_type(path)[0]
    self.path = path
  
  def __repr__(self):
    return '<sprockets.ProcessedAsset: "%s">' % self.path
  

class Environment:
  
  def __init__(self, assets_dir, cache_dir=None, minify=False, loglevel=logging.INFO):
    # set up logger
    self.logger = logging.getLogger('sprockets')
    self.logger.setLevel(loglevel)
    self.logger.addHandler(logging.StreamHandler(sys.stdout))
    # add & check assets dir(s)
    self.assets_dirs = []
    if type(assets_dir) == list:
      [self.add_assets_dir(path) for path in assets_dir]
    else:
      self.add_assets_dir(assets_dir)
    # set cache dir, creating if necessary
    self.cache_is_tempdir = cache_dir is None
    if cache_dir:
      self.cache_dir = cache_dir
      if not os.path.exists(self.cache_dir):
        os.mkdir(self.cache_dir)
    else:
      # create temporary directory for cache
      self.cache_dir = tempfile.mkdtemp()
      self.logger.info('created temporary cache dir at %s' % self.cache_dir)
    # create dir structure in cache
    for assets_dir in self.assets_dirs:
      self.copy_dir_structure(assets_dir, self.cache_dir)
    self.minify = minify
  
  def copy_dir_structure(self, src, dest):
    for listing in os.listdir(src):
      fullpath = os.path.join(src, listing)
      if os.path.isdir(fullpath):
        os.mkdir(os.path.join(dest, listing))
        self.copy_dir_structure(os.path.join(src, listing),
                                os.path.join(dest, listing))
  
  def __del__(self):
    # delete cache dir, if it was a temporary directory
    if self.cache_is_tempdir:
      self.logger.info('removing temporary cache dir %s' % self.cache_dir)
      shutil.rmtree(self.cache_dir)
  
  def __repr__(self):
    return '<sprockets.Environment for "%s">' % ':'.join(self.assets_dirs)
  
  def remove_leading_slash(self, path):
    if path[0] == '/':
      return path[1:]
    else:
      return path
  
  def add_assets_dir(self, path):
    path = self.remove_leading_slash(path)
    fullpath = os.path.abspath(path)
    if not os.path.exists(fullpath):
      raise Exception('asset dir %s does not exist' % fullpath)
    else:
      self.assets_dirs.append(fullpath)
  
  def get_asset(self, logical_path):
    """main access point: pass a logical path, get back an asset object"""
    # if processed asset is in cache and source asset hasn't been modified since it was processed,
    # return cached version. else, process, update cache, & return new version.
    logical_path = self.remove_leading_slash(logical_path)
    cached_asset_path = os.path.join(self.cache_dir, logical_path)
    # find unprocessed asset: will raise AssetNotFoundException if doesn't exist;
    # this method just lets it keep bubbling up
    source_asset_path, _ = self.find_source_asset(logical_path)
    if os.path.exists(cached_asset_path) and\
        os.stat(cached_asset_path).st_mtime >= os.stat(source_asset_path).st_mtime:
        return ProcessedAsset(cached_asset_path)
    else:
      outfile = self.process_asset(source_asset_path, logical_path)
      shutil.copyfile(outfile.name, cached_asset_path)
      return ProcessedAsset(cached_asset_path)
  
  def process_asset(self, source_path, logical_path):
    ext = source_path.split('.', 1)[1]
    infile = open(source_path)
    # do processing
    if ext.endswith('css.less'):
      outfile = self.compile_less(infile)
    elif ext.endswith('js.coffee'):
      includes = self.extract_includes(infile, '#')
      out1 = self.compile_coffeescript(infile)
      if self.minify:
        out2 = self.minify_js(out1)
      else:
        out2 = out1
      outfile = self.do_includes(out2, includes)
    elif ext.endswith('min.js'):
      # already minified: just includes
      includes = self.extract_includes(infile, '//')
      outfile = self.do_includes(infile, includes)
    elif ext.endswith('js'):
      includes = self.extract_includes(infile, '//')
      if self.minify:
        out = self.minify_js(infile)
      else:
        out = infile
      outfile = self.do_includes(out, includes)
    else:
      outfile = infile
    outfile.seek(0)
    return outfile
  
  def find_source_asset(self, logical_path):
    """return tuple: (abs. path to unprocessed asset, list of processors needed).
       e.g. find_source_asset('myfile.css') => ('/abspath/to/assets/dir/myfile.css.less', ['less'])
    """
    if logical_path[0] == '/':
      logical_path = logical_path[1:]
    for assets_dir in self.assets_dirs:
      lp_dir, lp_fn = os.path.split(logical_path)
      the_dir = os.path.join(assets_dir, lp_dir)
      if os.path.isdir(the_dir):
        for listing in os.listdir(the_dir):
          the_path = os.path.join(the_dir, listing)
          if os.path.isfile(the_path):
            is_match, processor_exts = self.match_filenames(lp_fn, listing)
            if is_match:
              return (the_path, processor_exts)
    raise AssetNotFoundException(logical_path)
  
  def match_filenames(self, requested, source):
    """e.g. match_filenames('myfile.css', 'myfile.css.less') => (True, ['less']);
            match_filenames('myfile.css', 'myfile.png') => (False, None)
    """
    requested_parts = requested.split('.')
    source_parts = source.split('.')
    i = 0
    while i < len(requested_parts):
      if requested_parts[i] != source_parts[i]:
        return (False, None)
      else:
        i += 1
    return (True, source_parts[i:])
  
  # PROCESSORS (perhaps these should be split off somehow, so it's easy to plug in new ones?)
  
  def compile_less(self, infile):
    self.logger.info("[lessc %s]" % infile.name)
    outfile = tempfile.NamedTemporaryFile()
    errfile = tempfile.TemporaryFile()
    retcode = subprocess.call(['lessc', infile.name], stdout=outfile, stderr=errfile)
    if retcode == 0:
      outfile.seek(0)
      return outfile
    else:
      # ugh
      def remove_control_chars(string):
        step1 = re.sub(r'\[\d+m', '', string)
        return ''.join([c for c in step1 if ord(c) >= 32])
      errfile.seek(0)
      first_line = errfile.readline()
      no_ccs = remove_control_chars(first_line)
      msg = re.search(r'(.* on line \d+)', no_ccs).group(1)
      raise ProcessingException('compiling less', infile.name, msg)
  
  def compile_coffeescript(self, infile):
    self.logger.info("[coffee -cp %s]" % infile.name)
    outfile = tempfile.NamedTemporaryFile()
    errfile = tempfile.TemporaryFile()
    retcode = subprocess.call(['coffee', '-cp', infile.name], stdout=outfile, stderr=errfile)
    if retcode == 0:
      outfile.seek(0)
      return outfile
    else:
      errfile.seek(0)
      firstline = errfile.readline()
      m = re.search(r'(.*) In .*, (.*)', firstline)
      msg = m.group(1) + ' ' + m.group(2)
      # msg = firstline[:-1]
      raise ProcessingException('compiling coffeescript', infile.name, msg)
  
  def minify_js(self, infile):
    self.logger.info("[uglifyjs %s]" % infile.name)
    outfile = tempfile.NamedTemporaryFile()
    errfile = tempfile.TemporaryFile()
    retcode = subprocess.call(['uglifyjs', infile.name], stdout=outfile, stderr=errfile)
    if retcode == 0:
      outfile.seek(0)
      return outfile
    else:
      errfile.seek(0)
      contents = errfile.read()
      msg = re.search(r"DEBUG: \{ message: '(.*)',", contents).group(1)
      raise ProcessingException('minifying js', infile.name, msg)
  
  def extract_includes(self, infile, comment_prefix):
    """e.g. extract_includes(myfile, '//') => [(1, 'a.js'), (2, 'b.js')],
      where foo.js starts with:
        //= include a.js
        //= include b.js
      all includes must be at the top!"""
    include_heading = '%s= include ' % comment_prefix
    includes = []
    lineno = 1
    for line in infile:
      if line.strip() == '':
        pass
      elif line.strip().startswith(include_heading):
        includes.append((lineno, line.strip().split(include_heading)[1]))
      else:
        break
      lineno += 1
    infile.seek(0)
    return includes
  
  def do_includes(self, infile, includes):
    self.logger.info("[includes for %s]" % infile.name)
    outfile = tempfile.NamedTemporaryFile()
    for lineno, include in includes:
      try:
        outfile.write(open(self.get_asset(include).path).read())
      except AssetNotFoundException:
        raise ProcessingException('processing includes', infile.name, 'line %d: asset "%s" not found' % (lineno, include))
    outfile.write(infile.read())
    outfile.seek(0)
    return outfile
  

class ProcessingException(Exception):
  
  def __init__(self, activity, path, error):
    super(ProcessingException, self).__init__('Error when %s in file %s: %s' % (activity, path, error))
    self.activity = activity
    self.path = path
    self.error = error
  

class AssetNotFoundException(Exception):
  def __init__(self, logical_path):
    super(AssetNotFoundException, self).__init__('asset not found for logical path "%s"' % logical_path)
    self.logical_path = logical_path
  
