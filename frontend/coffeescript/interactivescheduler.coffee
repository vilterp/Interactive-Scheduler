jQuery ->
  
  # Models
  
  class Completable extends Backbone.Model
    # isValid:bool
  
  class Bin extends Completable
    defaults:
      subCompletables: new Backbone.Collection.extend({
        model: Completable
      })
  
  class Course extends Completable
    
  
  class QuarterList extends Backbone.Collection
  
  class Schedule extends Backbone.Model
    defaults:
      quarters: new QuarterList
  
  class CourseList extends Backbone.Collection
  
  class Quarter extends Backbone.Model
    defaults:
      courses: new CourseList
    
  
  # Views
  
  class CourseView extends Backbone.View
    
  
  # initialize empty schedule
  grad_year = 2015 # gotta prompt the user for this somehow...
  start_year = grad_year - 4
  schedule = new Schedule({grad_year: grad_year})
  console.log(schedule, start_year)
  for year in [start_year..start_year+4]
    for season in ['fall', 'winter', 'spring']
      schedule.get('quarters').add(new Quarter({year: year, season: season}))
  schedule.get('quarters').each (c) ->
    console.log(c, c.get('courses'))
