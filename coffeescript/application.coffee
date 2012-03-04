jQuery ->
  
  class DragBoard extends Backbone.Model
    initialize: ->
      this.set('dragging', null)
    start_drag: (view) ->
      this.set('dragging', view)
    get_dragging_item: (view) ->
      if this.get('dragging')?
        this.get('dragging')
      else
        throw 'not currently dragging'
    stop_drag: ->
      this.set('dragging_view', null)
  
  window.drag_board = new DragBoard
  
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
      if @parent?
        @parent.check_valid()
      else
        console.log 'no parent'
    
  
  class Bin extends Completable
    type: 'bin'
    
    constructor: (title, num_required, sub_completables) ->
      super()
      this.set('title', title)
      this.set('num_complete', 0)
      this.set('num_required', num_required)
      this.set('sub_completables', new CompletablesList(sub_completables))
    
    initialize: ->
      this.on 'child_validated', (model) =>
        this.set 'num_complete', this.num_complete()
        this.set 'valid', (this.get('num_complete') == this.get('num_required'))
    
    @initialize_from_json: (parent, json) ->
      sub_completables = []
      for completable in json.list
        if completable.num? and completable.list? # another bin
          sub_completables.push(Bin.initialize_from_json(this, completable))
        else                                      # a course
          sub_completables.push(new Course(completable))
      new_bin = new Bin(json.title, json.num, sub_completables)
      for sc in sub_completables
        sc.parent = new_bin
      return new_bin
    
    num_complete: ->
      if this.get('sub_completables')?
        return this.get('sub_completables').filter((completable) -> completable.get('valid')).length
      else
        return 0
    
    is_valid: ->
      new_num = this.num_complete()
      if this.get('num_complete') != new_num
        this.set('num_complete', new_num)
      this.get('num_complete') == this.get('num_required')
  
  class CompletablesList extends Backbone.Collection
  
  class Course extends Completable
    @cache = {}
    type: 'course'
    initialize: ->
      this.set('quarter', null) # initially not on schedule
      this.on 'dragged_out', =>
        this.set('valid', true)
        @parent.trigger 'child_validated', this
        
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
      id: 'schedule-view'
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
          dragged_view = window.drag_board.get_dragging_item()
          window.drag_board.stop_drag()
          the_model = dragged_view.model
          @model.get('courses').add(the_model)
          the_model.set('quarter', @model)
          the_model.trigger('dragged_out')
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
    console.log(this)
    attributes: 
      class: 'bin'
      id:     ''
    template: _.template($('#bin-template').html())
    initialize: ->
      @model.on 'child_validated', this.reflect_child_validation, this
      @model.on 'child_validated', =>
        if @model.get('valid')
          @model.parent?.trigger 'child_validated', @model
    reflect_child_validation: (child_model) ->
      if child_model.type == 'course'
        # TODO: this is a little ugly.
        i = 0
        j = 0
        sub_completables = @model.get('sub_completables')
        console.log sub_completables
        while i < sub_completables.length
          sc = sub_completables.at(i)
          if sc == child_model
            break
          if sc.type == 'bin' || !sc.get('valid')
            j += 1
          i += 1
        $(@el).children('ul').children().eq(j).remove()
      this.render_stats()
    render_stats: ->
      # console.log 'rendering bin stats', $(@el).find('.bin-stats').first()
      $(@el).find('.bin-stats').first().html("#{@model.get('num_complete')} / #{@model.get('num_required')}")
            .addClass(if @model.is_valid() then 'label label-success' else 'label label-info')
      $(@el).removeClass('fulfilled').removeClass('not-fulfilled')
            .addClass(if @model.is_valid() then 'fulfilled' else 'not-fulfilled')
    render: ->
      # console.log 'rendering BinView', @el
      $(@el).html(@template({
        title: if @model.get('title')? then @model.get('title') else null
      }))
      this.render_stats()
      list = $(@el).find('ul')
      # render bin items
      @model.get('sub_completables').each (completable) =>
        new_view = null
        if completable.type == 'course'
          if !completable.get('valid')
            new_view = new CourseView({model: completable, parent_view: this})
        else if completable.type == 'bin'
          new_view = new BinView({model: completable, parent_view: this})
        else
          throw completable
        if new_view != null
          list.append($('<li class="bin-item" id='+completable.id+'>').append(new_view.render().el))
      return this
   
  class CourseView extends Backbone.View
    tagName: 'div'
    initialize: ->
      @model.on 'change:valid', this.render, this
    render: ->
      # console.log 'rendering CourseView', @el
      $(@el).addClass('course-in-bin').html(@model.get('title'))
      $(@el).draggable({
        drag: (event, ui) =>
          window.drag_board.start_drag(this)
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
  
  # This will go somewhere else eventually, but also enable accordian
  # $(".collapse").collapse()
