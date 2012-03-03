(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var Bin, BinView, Completable, CompletablesList, Course, CourseList, CourseView, MajorView, Objective, ObjectivesList, ObjectivesListView, Quarter, QuarterList, QuarterView, Schedule, SchedulePlan, SchedulePlanView, ScheduleView, objectives_list, schedule,
      _this = this;
    SchedulePlan = (function(_super) {

      __extends(SchedulePlan, _super);

      function SchedulePlan() {
        SchedulePlan.__super__.constructor.apply(this, arguments);
      }

      SchedulePlan.prototype.save_to_local_storage = function() {
        throw "not implemented";
      };

      SchedulePlan.load_from_local_storage = function() {
        throw "not implemented";
      };

      return SchedulePlan;

    })(Backbone.Model);
    ObjectivesList = (function(_super) {

      __extends(ObjectivesList, _super);

      function ObjectivesList() {
        ObjectivesList.__super__.constructor.apply(this, arguments);
      }

      return ObjectivesList;

    })(Backbone.Collection);
    Objective = (function(_super) {

      __extends(Objective, _super);

      function Objective() {
        Objective.__super__.constructor.apply(this, arguments);
      }

      Objective.TYPE_CORE = 0;

      Objective.TYPE_MAJOR = 1;

      Objective.TYPE_MINOR = 2;

      return Objective;

    })(Backbone.Model);
    Completable = (function(_super) {

      __extends(Completable, _super);

      function Completable() {
        Completable.__super__.constructor.apply(this, arguments);
      }

      Completable.prototype.initialize = function() {
        return this.set('valid', this.is_valid());
      };

      Completable.prototype.check_valid = function() {
        return this.set('valid', this.is_valid());
      };

      return Completable;

    })(Backbone.Model);
    Bin = (function(_super) {

      __extends(Bin, _super);

      Bin.prototype.type = 'bin';

      function Bin(title, num_required, sub_completables) {
        Bin.__super__.constructor.call(this);
        this.set('title', title);
        this.set('num_required', num_required);
        this.set('sub_completables', new CompletablesList(sub_completables));
      }

      Bin.initialize_from_json = function(parent, json) {
        var completable, sub_completables, _i, _len, _ref;
        sub_completables = [];
        _ref = json.list;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          completable = _ref[_i];
          if ((completable.num != null) && (completable.list != null)) {
            sub_completables.push(Bin.initialize_from_json(this, completable));
          } else {
            sub_completables.push(new Course(completable));
          }
        }
        return new Bin(json.title, json.num, sub_completables);
      };

      Bin.prototype.num_complete = function() {
        return _.filter(function(completable) {
          return completable.get('valid');
        }).length;
      };

      Bin.prototype.is_valid = function() {
        return this.num_complete() === this.get('num_required');
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

      Course.cache = {};

      Course.prototype.type = 'course';

      Course.prototype.initialize = function() {
        this.set('quarter', null);
        return Course.cache[this.get('id')] = this;
      };

      Course.prototype.is_valid = function() {
        return this.get('quarter') !== null;
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
        var season, seasons, start_year, year, years, _i, _ref, _results, _results2;
        this.set('quarters', new QuarterList);
        start_year = this.get('grad_year') - 4;
        years = (function() {
          _results = [];
          for (var _i = start_year, _ref = start_year + 4; start_year <= _ref ? _i <= _ref : _i >= _ref; start_year <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
        seasons = ['fall', 'winter', 'spring'];
        _results2 = [];
        for (year = 0; year <= 3; year++) {
          _results2.push((function() {
            var _results3;
            _results3 = [];
            for (season = 0; season <= 2; season++) {
              _results3.push(this.get('quarters').add(new Quarter({
                year: years[year],
                season: seasons[season]
              })));
            }
            return _results3;
          }).call(this));
        }
        return _results2;
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

      Quarter.prototype.initialize = function() {
        return this.set('courses', new CourseList);
      };

      return Quarter;

    })(Backbone.Model);
    ScheduleView = (function(_super) {

      __extends(ScheduleView, _super);

      function ScheduleView() {
        ScheduleView.__super__.constructor.apply(this, arguments);
      }

      ScheduleView.prototype.tagName = 'table';

      ScheduleView.prototype.attributes = {
        width: '100%',
        height: '100%',
        border: '1'
      };

      ScheduleView.prototype.template = _.template($('#schedule-template').html());

      ScheduleView.prototype.initialize = function() {
        var _this = this;
        this.subviews = [];
        return this.model.get('quarters').each(function(quarter) {
          return _this.subviews.push(new QuarterView({
            model: quarter
          }));
        });
      };

      ScheduleView.prototype.render = function() {
        var quarter_ind, year_ind, years;
        $(this.el).html(this.template());
        years = $(this.el).find('tr');
        for (year_ind = 0; year_ind <= 3; year_ind++) {
          for (quarter_ind = 0; quarter_ind <= 2; quarter_ind++) {
            $(years.get(year_ind)).append(this.subviews[year_ind * 3 + quarter_ind].render().el);
          }
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

      QuarterView.prototype.tagName = 'td';

      QuarterView.prototype.className = 'schedule-quarter';

      QuarterView.prototype.initialize = function() {
        this.model.get('courses').bind('all', this.render, this);
        return this.id = "quarter-" + (this.model.get('year')) + "-" + (this.model.get('season'));
      };

      QuarterView.prototype.render = function() {
        var _this = this;
        $(this.el).html(this.template({
          courses: this.model.get('courses').toJSON()
        }));
        $(this.el).droppable({
          activeClass: 'will-accept',
          hoverClass: 'hover',
          tolerance: 'pointer',
          drop: function(event, ui) {
            var course_id;
            course_id = ui.draggable.data('course-id');
            _this.model.get('courses').add(Course.cache[course_id]);
            Course.cache[course_id].check_valid();
            return $(ui.draggable).detach();
          }
        });
        return this;
      };

      return QuarterView;

    })(Backbone.View);
    SchedulePlanView = (function(_super) {

      __extends(SchedulePlanView, _super);

      function SchedulePlanView() {
        SchedulePlanView.__super__.constructor.apply(this, arguments);
      }

      SchedulePlanView.prototype.el = $('#scheduler-app')[0];

      SchedulePlanView.prototype.initialize = function() {
        this.schedule_view = new ScheduleView({
          model: this.model.get('schedule')
        });
        return this.objectives_view = new ObjectivesListView({
          model: this.model.get('objectives_list')
        });
      };

      SchedulePlanView.prototype.render = function() {
        $(this.el).find('#schedule-view-container').empty().append(this.schedule_view.render().el);
        $(this.el).find('#objectives-view-container').empty().append(this.objectives_view.render().el);
        return this;
      };

      return SchedulePlanView;

    })(Backbone.View);
    BinView = (function(_super) {

      __extends(BinView, _super);

      function BinView() {
        BinView.__super__.constructor.apply(this, arguments);
      }

      BinView.prototype.tagName = 'div';

      BinView.prototype.attributes = {
        "class": 'bin'
      };

      BinView.prototype.template = _.template($('#bin-template').html());

      BinView.prototype.initialize = function() {};

      BinView.prototype.render = function() {
        var list,
          _this = this;
        $(this.el).html('foo');
        $(this.el).html(this.template({
          num_complete: this.model.num_complete(),
          num_required: this.model.get('num_required'),
          title: this.model.get('title') != null ? this.model.get('title') : null
        }));
        $(this.el).addClass(this.model.is_valid() ? 'fulfilled' : 'not-fulfilled');
        list = $(this.el).find('ul');
        this.subviews = [];
        this.model.get('sub_completables').each(function(completable) {
          var new_view;
          new_view = null;
          if (completable.type === 'course' && !completable.get('valid')) {
            new_view = new CourseView({
              model: completable
            });
          } else if (completable.type === 'bin') {
            new_view = new BinView({
              model: completable
            });
          } else {
            console.log(completable);
            throw completable;
          }
          return list.append($('<li class="bin-item">').append(new_view.render().el));
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

      CourseView.prototype.initialize = function() {};

      CourseView.prototype.render = function() {
        $(this.el).addClass('course-in-bin').html(this.model.get('title'));
        $(this.el).data('course-id', this.model.get('id'));
        $(this.el).draggable({
          revert: 'invalid'
        });
        return this;
      };

      return CourseView;

    })(Backbone.View);
    MajorView = (function(_super) {

      __extends(MajorView, _super);

      function MajorView() {
        MajorView.__super__.constructor.apply(this, arguments);
      }

      MajorView.prototype.tagName = 'div';

      MajorView.prototype.className = 'objective-major';

      MajorView.prototype.template = _.template($('#objective-template').html());

      MajorView.prototype.initialize = function() {
        return this.bin_view = new BinView({
          model: this.model.get('bin')
        });
      };

      MajorView.prototype.render = function() {
        $(this.el).html(this.template({
          title: this.model.get('title')
        }));
        $(this.el).find(".objective-bin").append(this.bin_view.render().el);
        return this;
      };

      return MajorView;

    })(Backbone.View);
    ObjectivesListView = (function(_super) {

      __extends(ObjectivesListView, _super);

      function ObjectivesListView() {
        ObjectivesListView.__super__.constructor.apply(this, arguments);
      }

      ObjectivesListView.prototype.tagName = 'div';

      ObjectivesListView.prototype.id = 'objectives-view';

      ObjectivesListView.prototype.template = _.template($('#objectives-list-template').html());

      ObjectivesListView.prototype.initialize = function() {
        var _this = this;
        this.subviews = [];
        return this.model.each(function(objective) {
          var new_view;
          switch (objective.get('type')) {
            case Objective.TYPE_MAJOR:
              new_view = new MajorView({
                model: objective
              });
              return _this.subviews.push(new_view);
            default:
              throw "not implemented";
          }
        });
      };

      ObjectivesListView.prototype.render = function() {
        var the_list,
          _this = this;
        $(this.el).html(this.template());
        the_list = $(this.el).find('ul');
        _.each(this.subviews, function(subview) {
          return the_list.append($("<li>").append(subview.render().el));
        });
        return this;
      };

      return ObjectivesListView;

    })(Backbone.View);
    $('body').ajaxError(function() {
      return console.log(arguments[3].toString());
    });
    schedule = new Schedule({
      grad_year: 2015
    });
    objectives_list = new ObjectivesList;
    return $.getJSON('/static/major_reqs/cmsc.json', function(cmsc_bin) {
      var app_view, cmsc, schedule_plan;
      cmsc = Bin.initialize_from_json(null, cmsc_bin);
      objectives_list.add(new Objective({
        title: "Computer Science",
        type: Objective.TYPE_MAJOR,
        bin: cmsc
      }));
      schedule_plan = new SchedulePlan({
        schedule: schedule,
        objectives_list: objectives_list
      });
      app_view = new SchedulePlanView({
        model: schedule_plan
      });
      return app_view.render();
    });
  });

}).call(this);
