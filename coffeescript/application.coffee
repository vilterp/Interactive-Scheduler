jQuery ->
  
  # ========== Models =======================================================================
  
  class SchedulePlan extends Backbone.Model
    # holds schedule state and objectives -- all of the user's state.
    # attrs: Schedule schedule, ObjectivesList objectives_list
    save_to_local_storage: ->
      throw "not implemented"
    
    @load_from_local_storage: ->
      throw "not implemented"
    
  
  class ObjectivesList extends Backbone.Collection
  
  class Objective extends Backbone.Model
    # represents a major, a minor, or the core requirements
    @TYPE_CORE = 0
    @TYPE_MAJOR = 1
    @TYPE_MINOR = 2
    # attrs: title, type, bin
  
  class Completable extends Backbone.Model
    # attrs: valid
    initialize: ->
      this.set('valid', this.is_valid())
    
    check_valid: ->
      this.set('valid', this.is_valid())
      # @parent.check_valid()
    
  
  class Bin extends Completable
    type: 'bin'
    
    constructor: (title, num_required, sub_completables) ->
      super()
      this.set('title', title)
      this.set('num_required', num_required)
      this.set('sub_completables', new CompletablesList(sub_completables))
    
    @initialize_from_json: (parent, json) ->
      sub_completables = []
      for completable in json.list
        if completable.num? and completable.list? # another bin
          sub_completables.push(Bin.initialize_from_json(this, completable))
        else                                      # a course
          sub_completables.push(new Course(completable))
      return new Bin(json.title, json.num, sub_completables)
    
    num_complete: ->
      return _.filter((completable) -> completable.get('valid')).length
    
    is_valid: ->
      this.num_complete() == this.get('num_required')
  
  class CompletablesList extends Backbone.Collection
  
  class Course extends Completable
    @cache = {}
    type: 'course'
    initialize: ->
      this.set('quarter', null) # initially not on schedule
      Course.cache[this.get('id')] = this
      # TODO: initialize prereqs correctly
    
    is_valid: ->
      this.get('quarter') != null
  
  class QuarterList extends Backbone.Collection
  
  class Schedule extends Backbone.Model
    initialize: ->
      this.set('quarters', new QuarterList)
      start_year = this.get('grad_year') - 4
      years = [start_year..start_year+4]
      seasons = ['fall', 'winter', 'spring']
      for year in [0..3]
        for season in [0..2]
          this.get('quarters').add(new Quarter({year: years[year], season: seasons[season]}))
  
  class CourseList extends Backbone.Collection
  
  class Quarter extends Backbone.Model
    # attrs: year, season, courses
    initialize: ->
      this.set('courses', new CourseList)
  
  # ========== Views =======================================================================
  
  class ScheduleView extends Backbone.View
    tagName: 'table'
    attributes:
      width: '100%'
      height: '100%'
      border: '1'
    template: _.template($('#schedule-template').html())
    initialize: ->
      @subviews = []
      @model.get('quarters').each (quarter) =>
        @subviews.push(new QuarterView({model: quarter}))
    render: ->
      $(@el).html(@template())
      years = $(@el).find('tr')
      for year_ind in [0..3]
        for quarter_ind in [0..2]
          $(years.get(year_ind)).append(@subviews[year_ind*3+quarter_ind].render().el)
      return this
    
  
  class QuarterView extends Backbone.View
    template: _.template($('#quarter-template').html())
    tagName: 'td'
    className: 'schedule-quarter'
    initialize: ->
      @model.get('courses').bind('all', this.render, this)
      @id = "quarter-#{@model.get('year')}-#{@model.get('season')}"
    render: ->
      # TODO: these should be course views too
      $(@el).html(@template({courses: @model.get('courses').toJSON()}))
      $(@el).droppable({
        activeClass: 'will-accept'
        hoverClass: 'hover'
        tolerance: 'pointer'
        drop: (event, ui) =>
          course_id = ui.draggable.data('course-id')
          @model.get('courses').add(Course.cache[course_id])
          Course.cache[course_id].check_valid()
          $(ui.draggable).detach()
      })
      return this
  
  class SchedulePlanView extends Backbone.View
    el: $('#scheduler-app')[0]
    initialize: ->
      @schedule_view = new ScheduleView({model: @model.get('schedule')})
      @objectives_view = new ObjectivesListView({model: @model.get('objectives_list')})
    render: ->
      $(@el).find('#schedule-view-container').empty().append(@schedule_view.render().el)
      $(@el).find('#objectives-view-container').empty().append(@objectives_view.render().el)
      return this
    
  
  class BinView extends Backbone.View
    tagName: 'div'
    attributes: { class: 'bin' }
    template: _.template($('#bin-template').html())
    initialize: ->
      # @model.bind 'change:valid', this.render, this
    render: ->
      $(@el).html('foo')
      $(@el).html(@template({
        num_complete: @model.num_complete(),
        num_required: @model.get('num_required'),
        title: if @model.get('title')? then @model.get('title') else null
      }))
      $(@el).addClass(if @model.is_valid() then 'fulfilled' else 'not-fulfilled')
      list = $(@el).find('ul')
      # render bin items
      @subviews = []
      @model.get('sub_completables').each (completable) =>
        new_view = null
        if completable.type == 'course' and !completable.get('valid')
          new_view = new CourseView({model: completable})
        else if completable.type == 'bin'
          new_view = new BinView({model: completable})
        else
          console.log completable
          throw completable
        list.append($('<li class="bin-item">').append(new_view.render().el))
      return this
   
  class CourseView extends Backbone.View
    tagName: 'div'
    initialize: ->
      # on change in quarter: check_valid parent
    render: ->
      $(@el).addClass('course-in-bin').html(@model.get('title'))
      $(@el).data('course-id', @model.get('id'))
      $(@el).draggable({
        # cursor: 'move'
        revert: 'invalid'
      })
      return this
  
  
  class MajorView extends Backbone.View
    tagName: 'div'
    className: 'objective-major'
    template: _.template($('#objective-template').html())
    initialize: ->
      @bin_view = new BinView({model: @model.get('bin')})
    render: ->
      $(@el).html(@template({
        title: @model.get('title')
      }))
      $(@el).find(".objective-bin").append(@bin_view.render().el)
      return this
  
  class ObjectivesListView extends Backbone.View
    tagName: 'div'
    id: 'objectives-view'
    template: _.template($('#objectives-list-template').html())
    initialize: ->
      @subviews = []
      @model.each (objective) =>
        switch objective.get('type')
          when Objective.TYPE_MAJOR
            new_view = new MajorView({model: objective})
            @subviews.push(new_view)
          else
            throw "not implemented"
    render: ->
      $(@el).html(@template())
      the_list = $(@el).find('ul')
      _.each @subviews, (subview) =>
        the_list.append($("<li>").append(subview.render().el))
      return this
    
  
  # ========== Initialization =======================================================================
  
  $('body').ajaxError ->
    console.log(arguments[3].toString())
  
  # initialize empty schedule
  schedule = new Schedule({grad_year: 2015}) # gotta prompt user for this somehow
  objectives_list = new ObjectivesList
  
  # load cmsc bin
  $.getJSON '/static/major_reqs/cmsc.json', (cmsc_bin) =>
    # add CS major to objectives list
    cmsc = Bin.initialize_from_json(null, cmsc_bin)
    objectives_list.add(new Objective({
      title: "Computer Science",
      type: Objective.TYPE_MAJOR,
      bin: cmsc
    }))
    # create the schedule plan
    schedule_plan = new SchedulePlan({
      schedule: schedule,
      objectives_list: objectives_list
    })
    # initialize the app (this triggers all the rendering!)
    app_view = new SchedulePlanView({model: schedule_plan})
    app_view.render()
  
