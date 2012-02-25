(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var AppView, Bin, BinView, Completable, CompletablesList, Course, CourseList, CourseView, Quarter, QuarterList, QuarterView, Schedule, ScheduleView, grad_year, quarter, schedule, schedule_view, season, seasons, start_year, view, year, years, _i, _ref, _results,
      _this = this;
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

      Bin.prototype.type = 'bin';

      Bin.prototype.initialize = function(title, num_required, sub_completables) {
        this.set('title', title);
        this.set('num_required', num_required);
        return this.set('sub_completables', new CompletablesList(sub_completables));
      };

      Bin.initialize_from_json = function(json) {
        var completable, sub_completables, _i, _len, _ref;
        sub_completables = [];
        _ref = json.list;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          completable = _ref[_i];
          if ((completable.num != null) && (completable.list != null)) {
            sub_completables.push(Bin.initialize_from_json(completable));
          } else {
            sub_completables.push(new Course(completable));
          }
        }
        return new Bin(json.title, json.num, sub_completables);
      };

      Bin.prototype.numComplete = function() {
        return 0;
      };

      Bin.prototype.isValid = function() {
        return this.numComplete() === this.get('num_required');
      };

      return Bin;

    })(Completable);
    CompletablesList = (function(_super) {

      __extends(CompletablesList, _super);

      function CompletablesList() {
        CompletablesList.__super__.constructor.apply(this, arguments);
      }

      return CompletablesList;

    })(Backbone.Collection);
    Course = (function(_super) {

      __extends(Course, _super);

      function Course() {
        Course.__super__.constructor.apply(this, arguments);
      }

      Course.prototype.type = 'course';

      Course.prototype.initialize = function(args) {
        Course.__super__.initialize.call(this, args);
        return this.set('quarter', null);
      };

      Course.prototype.isValid = function() {
        return false;
      };

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

      Schedule.prototype.initialize = function() {
        return this.set('quarters', new QuarterList);
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

      Quarter.prototype.initialize = function(attrs) {
        Quarter.__super__.initialize.call(this, attrs);
        return this.set('courses', new CourseList);
      };

      return Quarter;

    })(Backbone.Model);
    ScheduleView = (function(_super) {

      __extends(ScheduleView, _super);

      function ScheduleView() {
        ScheduleView.__super__.constructor.apply(this, arguments);
      }

      ScheduleView.prototype.tagName = 'div';

      ScheduleView.prototype.id = 'schedule-viz';

      ScheduleView.prototype.template = _.template($('#schedule-template').html());

      ScheduleView.prototype.initialize = function() {
        return this.subviews = [];
      };

      ScheduleView.prototype.add_subview = function(subview) {
        return this.subviews.push(subview);
      };

      ScheduleView.prototype.render = function() {
        var i, _ref;
        console.log('rendering schedule view');
        $(this.el).html(this.template());
        for (i = 0, _ref = this.subviews.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          console.log(i, "#quarter-" + (Math.floor(i / 3)) + "-" + (i % 3), $(this.el).find("#quarter-" + (Math.floor(i / 4)) + "-" + (i % 4)));
          $(this.el).find("#quarter-" + (Math.floor(i / 3)) + "-" + (i % 3)).empty().append(this.subviews[i].render().el);
        }
        return this;
      };

      return ScheduleView;

    })(Backbone.View);
    QuarterView = (function(_super) {

      __extends(QuarterView, _super);

      function QuarterView() {
        QuarterView.__super__.constructor.apply(this, arguments);
      }

      QuarterView.prototype.template = _.template($('#quarter-template').html());

      QuarterView.prototype.tagName = 'div';

      QuarterView.prototype.initialize = function() {
        return this.model.get('courses').bind('add', this.render, this);
      };

      QuarterView.prototype.render = function() {
        console.log('rendering quarter view');
        $(this.el).html(this.template({
          courses: this.model.get('courses').toJSON()
        }));
        console.log(this.attributes);
        return this;
      };

      return QuarterView;

    })(Backbone.View);
    AppView = (function(_super) {

      __extends(AppView, _super);

      function AppView() {
        AppView.__super__.constructor.apply(this, arguments);
      }

      AppView.prototype.el = $('#scheduler-app');

      AppView.prototype.initialize = function(schedule_view, bin_view) {
        this.schedule_view = schedule_view;
        this.bin_view = bin_view;
        return this.el = $('#scheduler-app');
      };

      AppView.prototype.render = function() {
        console.log('rendering app view');
        $(this.el).find('#schedule-viz-container').append(this.schedule_view.render().el);
        return this;
      };

      return AppView;

    })(Backbone.View);
    BinView = (function(_super) {

      __extends(BinView, _super);

      function BinView() {
        BinView.__super__.constructor.apply(this, arguments);
      }

      BinView.prototype.tagName = 'div';

      BinView.prototype.template = _.template($('#bin-template').html());

      BinView.prototype.initialize = function() {
        var _this = this;
        this.subviews = [];
        return this.model.get('sub_completables').each(function(completable) {
          var new_view;
          new_view = null;
          if (completable.type === 'course') {
            new_view = new CourseView(completable);
          } else if (completable.type === 'bin') {
            new_view = new BinView(completable);
          }
          return _this.subviews.push(new_view);
        });
      };

      BinView.prototype.render = function() {
        var list, _ref,
          _this = this;
        console.log('rendering bin view');
        $(this.el).html('foo');
        $(this.el).html(this.template());
        $(this.el).addClass((_ref = this.model.isValid()) != null ? _ref : {
          'fulfilled': 'not-fulfilled'
        });
        $(this.el).find('span').html("" + (this.model.numComplete()) + " / " + (this.model.get('num_required')) + " complete");
        list = $(this.el).find('ul');
        _.each(this.subviews, function(subview) {
          return list.append($('<li class="bin-item">').append(subview.render().el));
        });
        return this;
      };

      return BinView;

    })(Backbone.View);
    CourseView = (function(_super) {

      __extends(CourseView, _super);

      function CourseView() {
        CourseView.__super__.constructor.apply(this, arguments);
      }

      CourseView.prototype.tagName = 'div';

      CourseView.prototype.render = function() {
        console.log('rendering course view');
        $(this.el).addClass('course-in-bin').html(this.model.title);
        return this;
      };

      return CourseView;

    })(Backbone.View);
    grad_year = 2015;
    start_year = grad_year - 4;
    schedule = new Schedule({
      grad_year: grad_year
    });
    window.schedule = schedule;
    schedule_view = new ScheduleView({
      model: schedule
    });
    years = (function() {
      _results = [];
      for (var _i = start_year, _ref = start_year + 4; start_year <= _ref ? _i <= _ref : _i >= _ref; start_year <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    seasons = ['fall', 'winter', 'spring'];
    for (year = 0; year <= 3; year++) {
      for (season = 0; season <= 2; season++) {
        quarter = new Quarter({
          year: years[year],
          season: seasons[season]
        });
        view = new QuarterView({
          model: quarter
        });
        schedule_view.add_subview(view);
        schedule.get('quarters').add(quarter);
      }
    }
    $('body').ajaxError(function() {
      return console.log(arguments[3].toString());
    });
    return $.getJSON('/static/sample-schedule.json', function(sample_schedule) {
      var course, course_list, enum_years, quarter_model, season, year, _j, _len;
      console.log('got the schedule');
      enum_years = ['first', 'second', 'third', 'fourth'];
      for (year = 0; year <= 3; year++) {
        for (season = 0; season <= 2; season++) {
          course_list = sample_schedule[enum_years[year]][seasons[season]];
          quarter_model = schedule.get('quarters').at(year * 3 + season);
          for (_j = 0, _len = course_list.length; _j < _len; _j++) {
            course = course_list[_j];
            quarter_model.get('courses').add(new Course({
              title: course
            }));
          }
        }
      }
      return $.getJSON('/static/major_reqs/cmsc.json', function(cmsc_bin) {
        var app_view, bin_view, cmsc;
        console.log('got cmsc');
        cmsc = Bin.initialize_from_json(cmsc_bin);
        bin_view = null;
        app_view = new AppView(schedule_view, bin_view);
        return app_view.render();
      });
    });
  });

}).call(this);
