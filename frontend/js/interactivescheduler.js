(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var Bin, Completable, Course, CourseList, CourseView, Quarter, QuarterList, Schedule, grad_year, schedule, season, start_year, year, _i, _len, _ref, _ref2;
    Completable = (function(_super) {

      __extends(Completable, _super);

      function Completable() {
        Completable.__super__.constructor.apply(this, arguments);
      }

      return Completable;

    })(Backbone.Model);
    Bin = (function(_super) {

      __extends(Bin, _super);

      function Bin() {
        Bin.__super__.constructor.apply(this, arguments);
      }

      Bin.prototype.defaults = {
        subCompletables: new Backbone.Collection.extend({
          model: Completable
        })
      };

      return Bin;

    })(Completable);
    Course = (function(_super) {

      __extends(Course, _super);

      function Course() {
        Course.__super__.constructor.apply(this, arguments);
      }

      return Course;

    })(Completable);
    QuarterList = (function(_super) {

      __extends(QuarterList, _super);

      function QuarterList() {
        QuarterList.__super__.constructor.apply(this, arguments);
      }

      return QuarterList;

    })(Backbone.Collection);
    Schedule = (function(_super) {

      __extends(Schedule, _super);

      function Schedule() {
        Schedule.__super__.constructor.apply(this, arguments);
      }

      Schedule.prototype.defaults = {
        quarters: new QuarterList
      };

      return Schedule;

    })(Backbone.Model);
    CourseList = (function(_super) {

      __extends(CourseList, _super);

      function CourseList() {
        CourseList.__super__.constructor.apply(this, arguments);
      }

      return CourseList;

    })(Backbone.Collection);
    Quarter = (function(_super) {

      __extends(Quarter, _super);

      function Quarter() {
        Quarter.__super__.constructor.apply(this, arguments);
      }

      Quarter.prototype.defaults = {
        courses: new CourseList
      };

      return Quarter;

    })(Backbone.Model);
    CourseView = (function(_super) {

      __extends(CourseView, _super);

      function CourseView() {
        CourseView.__super__.constructor.apply(this, arguments);
      }

      return CourseView;

    })(Backbone.View);
    grad_year = 2015;
    start_year = grad_year - 4;
    schedule = new Schedule({
      grad_year: grad_year
    });
    console.log(schedule, start_year);
    for (year = start_year, _ref = start_year + 4; start_year <= _ref ? year <= _ref : year >= _ref; start_year <= _ref ? year++ : year--) {
      _ref2 = ['fall', 'winter', 'spring'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        season = _ref2[_i];
        schedule.get('quarters').add(new Quarter({
          year: year,
          season: season
        }));
      }
    }
    return schedule.get('quarters').each(function(c) {
      return console.log(c, c.get('courses'));
    });
  });

}).call(this);
