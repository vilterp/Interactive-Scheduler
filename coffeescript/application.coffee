jQuery ->
  
  # ========== Models =======================================================================
  
  class Completable extends Backbone.Model
  
  class Bin extends Completable
    type: 'bin'
    
    constructor: (title, num_required, sub_completables) ->
      super()
      this.set('title', title)
      this.set('num_required', num_required)
      this.set('sub_completables', new CompletablesList(sub_completables))
    
    @initialize_from_json: (json) ->
      sub_completables = []
      for completable in json.list
        if completable.num? and completable.list? # another bin
          sub_completables.push(Bin.initialize_from_json(completable))
        else                                      # a course
          sub_completables.push(new Course(completable))
      return new Bin(json.title, json.num, sub_completables)
    
    num_complete: ->
      return 0 # TODO: validate subcompletables
    
    is_valid: ->
      return this.num_complete() == this.get('num_required')
  
  class CompletablesList extends Backbone.Collection
  
  class Course extends Completable
    type: 'course'
    
    initialize: (args) ->
      super(args)
      this.set('quarter', null) # initially not on schedule
      # will have to expand course codes in here for this to work, probably with cache dict
      # this.set('prereqs_bin', if this.get('prereqs_json') then Bin.initialize_from_json(this.get('prereqs_json')) else null)
    
    isValid: ->
      return false # TODO check if it's on the 
    
  
  class QuarterList extends Backbone.Collection
  
  class Schedule extends Backbone.Model
    initialize: ->
      this.set('quarters', new QuarterList)
  
  class CourseList extends Backbone.Collection
  
  class Quarter extends Backbone.Model
    initialize: (attrs) ->
      super(attrs)
      this.set('courses', new CourseList)
  
  # ========== Views =======================================================================
  
  class ScheduleView extends Backbone.View
    tagName: 'div'
    id: 'schedule-viz'
    template: _.template($('#schedule-template').html())
    initialize: ->
      @subviews = []
    add_subview: (subview) ->
      @subviews.push(subview)
    render: ->
      $(@el).html(@template())
      for i in [0...@subviews.length]
        $(@el).find("#quarter-#{Math.floor(i/3)}-#{i%3}").empty().append(@subviews[i].render().el)
      return this
    
  
  class QuarterView extends Backbone.View
    template: _.template($('#quarter-template').html())
    tagName: 'div'
    initialize: ->
      @model.get('courses').bind('add', this.render, this)
    render: ->
      $(@el).html(@template({courses: @model.get('courses').toJSON()}))
      return this
  
  class AppView extends Backbone.View
    el: $('#scheduler-app') # it's ignoring this for some reason...
    initialize: (schedule_view, bin_view) ->
      @schedule_view = schedule_view
      @bin_view = bin_view
      @el = $('#scheduler-app')
    render: ->
      $(@el).find('#schedule-viz-container').append(@schedule_view.render().el)
      $(@el).find('#major-panel-container').append(@bin_view.render().el)
      return this
    
    # handle top-level events here...
  
  class BinView extends Backbone.View
    tagName: 'div'
    attributes: { class: 'bin' }
    template: _.template($('#bin-template').html())
    initialize: ->
      @subviews = []
      @model.get('sub_completables').each (completable) =>
        new_view = null
        if completable.type == 'course'
          new_view = new CourseView({model: completable})
        else if completable.type == 'bin'
          new_view = new BinView({model: completable})
        @subviews.push(new_view)
    render: ->
      console.log 'rendering BinView', this
      $(@el).html('foo')
      $(@el).html(@template({
        num_complete: @model.num_complete(),
        num_required: @model.get('num_required'),
        title: if @model.get('title')? then @model.get('title') else null
      }))
      $(@el).addClass(if @model.is_valid() then 'fulfilled' else 'not-fulfilled')
      list = $(@el).find('ul')
      _.each @subviews, (subview) =>
        list.append($('<li class="bin-item">').append(subview.render().el))
      return this
   
  class CourseView extends Backbone.View
    tagName: 'div'
    render: ->
      console.log 'rendering CourseView', this
      $(@el).addClass('course-in-bin').html(@model.get('title'))
      return this
  
  
  # ========== Initialization =======================================================================
  
  # initialize empty schedule
  grad_year = 2015 # gotta prompt the user for this somehow...
  start_year = grad_year - 4
  schedule = new Schedule({grad_year: grad_year})
  window.schedule = schedule
  schedule_view = new ScheduleView({model: schedule})
  
  years = [start_year..start_year+4]
  seasons = ['fall', 'winter', 'spring']
  for year in [0..3]
    for season in [0..2]
      quarter = new Quarter({year: years[year], season: seasons[season]})
      view = new QuarterView({model: quarter})
      schedule_view.add_subview(view)
      schedule.get('quarters').add(quarter)
  
  $('body').ajaxError ->
    console.log(arguments[3].toString())
  
  # load sample schedule state
  $.getJSON '/static/sample-schedule.json', (sample_schedule) =>
    enum_years = ['first', 'second', 'third', 'fourth']
    for year in [0..3]
      for season in [0..2]
        course_list = sample_schedule[enum_years[year]][seasons[season]]
        quarter_model = schedule.get('quarters').at(year*3 + season)
        for course in course_list
          quarter_model.get('courses').add(new Course({title: course}))
    # load test bin
    $.getJSON '/static/major_reqs/cmsc.json', (cmsc_bin) =>
      cmsc = Bin.initialize_from_json(cmsc_bin)
      bin_view = new BinView({model: cmsc})
      # initialize the app
      app_view = new AppView(schedule_view, bin_view)
      app_view.render()
  
