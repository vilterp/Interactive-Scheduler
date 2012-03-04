(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  jQuery(function() {
    var Bin, BinView, Completable, CompletablesList, Course, CourseList, CourseView, DragBoard, MajorView, Objective, ObjectivesList, ObjectivesListView, Quarter, QuarterList, QuarterView, Schedule, SchedulePlan, SchedulePlanView, ScheduleView, objectives_list, schedule;
    DragBoard = (function() {
      __extends(DragBoard, Backbone.Model);
      function DragBoard() {
        DragBoard.__super__.constructor.apply(this, arguments);
      }
      DragBoard.prototype.initialize = function() {
        return this.set('dragging', null);
      };
      DragBoard.prototype.start_drag = function(view) {
        return this.set('dragging', view);
      };
      DragBoard.prototype.get_dragging_item = function(view) {
        if (this.get('dragging') != null) {
          return this.get('dragging');
        } else {
          throw 'not currently dragging';
        }
      };
      DragBoard.prototype.stop_drag = function() {
        return this.set('dragging_view', null);
      };
      return DragBoard;
    })();
    window.drag_board = new DragBoard;
    SchedulePlan = (function() {
      __extends(SchedulePlan, Backbone.Model);
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
    })();
    ObjectivesList = (function() {
      __extends(ObjectivesList, Backbone.Collection);
      function ObjectivesList() {
        ObjectivesList.__super__.constructor.apply(this, arguments);
      }
      return ObjectivesList;
    })();
    Objective = (function() {
      __extends(Objective, Backbone.Model);
      function Objective() {
        Objective.__super__.constructor.apply(this, arguments);
      }
      Objective.TYPE_CORE = 0;
      Objective.TYPE_MAJOR = 1;
      Objective.TYPE_MINOR = 2;
      return Objective;
    })();
    Completable = (function() {
      __extends(Completable, Backbone.Model);
      function Completable() {
        Completable.__super__.constructor.apply(this, arguments);
      }
      Completable.prototype.initialize = function() {
        return this.set('valid', this.is_valid());
      };
      Completable.prototype.check_valid = function() {
        this.set('valid', this.is_valid());
        if (this.parent != null) {
          return this.parent.check_valid();
        } else {
          return console.log('no parent');
        }
      };
      return Completable;
    })();
    Bin = (function() {
      __extends(Bin, Completable);
      Bin.prototype.type = 'bin';
      function Bin(title, num_required, sub_completables) {
        Bin.__super__.constructor.call(this);
        this.set('title', title);
        this.set('num_complete', 0);
        this.set('num_required', num_required);
        this.set('sub_completables', new CompletablesList(sub_completables));
      }
      Bin.prototype.initialize = function() {
        return this.on('child_validated', __bind(function(model) {
          this.set('num_complete', this.num_complete());
          return this.set('valid', this.get('num_complete') === this.get('num_required'));
        }, this));
      };
      Bin.initialize_from_json = function(parent, json) {
        var completable, new_bin, sc, sub_completables, _i, _j, _len, _len2, _ref;
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
        new_bin = new Bin(json.title, json.num, sub_completables);
        for (_j = 0, _len2 = sub_completables.length; _j < _len2; _j++) {
          sc = sub_completables[_j];
          sc.parent = new_bin;
        }
        return new_bin;
      };
      Bin.prototype.num_complete = function() {
        if (this.get('sub_completables') != null) {
          return this.get('sub_completables').filter(function(completable) {
            return completable.get('valid');
          }).length;
        } else {
          return 0;
        }
      };
      Bin.prototype.is_valid = function() {
        var new_num;
        new_num = this.num_complete();
        if (this.get('num_complete') !== new_num) {
          this.set('num_complete', new_num);
        }
        return this.get('num_complete') === this.get('num_required');
      };
      return Bin;
    })();
    CompletablesList = (function() {
      __extends(CompletablesList, Backbone.Collection);
      function CompletablesList() {
        CompletablesList.__super__.constructor.apply(this, arguments);
      }
      return CompletablesList;
    })();
    Course = (function() {
      __extends(Course, Completable);
      function Course() {
        Course.__super__.constructor.apply(this, arguments);
      }
      Course.cache = {};
      Course.prototype.type = 'course';
      Course.prototype.initialize = function() {
        this.set('quarter', null);
        this.on('dragged_out', __bind(function() {
          this.set('valid', true);
          return this.parent.trigger('child_validated', this);
        }, this));
        return Course.cache[this.get('id')] = this;
      };
      Course.prototype.is_valid = function() {
        return this.get('quarter') !== null;
      };
      return Course;
    })();
    QuarterList = (function() {
      __extends(QuarterList, Backbone.Collection);
      function QuarterList() {
        QuarterList.__super__.constructor.apply(this, arguments);
      }
      return QuarterList;
    })();
    Schedule = (function() {
      __extends(Schedule, Backbone.Model);
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
        }).apply(this, arguments);
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
    })();
    CourseList = (function() {
      __extends(CourseList, Backbone.Collection);
      function CourseList() {
        CourseList.__super__.constructor.apply(this, arguments);
      }
      return CourseList;
    })();
    Quarter = (function() {
      __extends(Quarter, Backbone.Model);
      function Quarter() {
        Quarter.__super__.constructor.apply(this, arguments);
      }
      Quarter.prototype.initialize = function() {
        return this.set('courses', new CourseList);
      };
      return Quarter;
    })();
    ScheduleView = (function() {
      __extends(ScheduleView, Backbone.View);
      function ScheduleView() {
        ScheduleView.__super__.constructor.apply(this, arguments);
      }
      ScheduleView.prototype.tagName = 'table';
      ScheduleView.prototype.attributes = {
        id: 'schedule-view'
      };
      ScheduleView.prototype.template = _.template($('#schedule-template').html());
      ScheduleView.prototype.initialize = function() {
        this.subviews = [];
        return this.model.get('quarters').each(__bind(function(quarter) {
          return this.subviews.push(new QuarterView({
            model: quarter
          }));
        }, this));
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
    })();
    QuarterView = (function() {
      __extends(QuarterView, Backbone.View);
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
        $(this.el).html(this.template({
          courses: this.model.get('courses').toJSON()
        }));
        $(this.el).droppable({
          activeClass: 'will-accept',
          hoverClass: 'hover',
          tolerance: 'pointer',
          drop: __bind(function(event, ui) {
            var dragged_view, the_model;
            dragged_view = window.drag_board.get_dragging_item();
            window.drag_board.stop_drag();
            the_model = dragged_view.model;
            this.model.get('courses').add(the_model);
            the_model.set('quarter', this.model);
            the_model.trigger('dragged_out');
            return $(ui.draggable).detach();
          }, this)
        });
        return this;
      };
      return QuarterView;
    })();
    SchedulePlanView = (function() {
      __extends(SchedulePlanView, Backbone.View);
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
    })();
    BinView = (function() {
      __extends(BinView, Backbone.View);
      function BinView() {
        BinView.__super__.constructor.apply(this, arguments);
      }
      BinView.prototype.tagName = 'div';
      BinView.prototype.attributes = {
        "class": 'bin'
      };
      BinView.prototype.template = _.template($('#bin-template').html());
      BinView.prototype.initialize = function() {
        this.model.on('child_validated', this.reflect_child_validation, this);
        return this.model.on('child_validated', __bind(function() {
          var _ref;
          if (this.model.get('valid')) {
            return (_ref = this.model.parent) != null ? _ref.trigger('child_validated', this.model) : void 0;
          }
        }, this));
      };
      BinView.prototype.reflect_child_validation = function(child_model) {
        var i, j, sc, sub_completables;
        if (child_model.type === 'course') {
          i = 0;
          j = 0;
          sub_completables = this.model.get('sub_completables');
          console.log(sub_completables);
          while (i < sub_completables.length) {
            sc = sub_completables.at(i);
            if (sc === child_model) {
              break;
            }
            if (sc.type === 'bin' || !sc.get('valid')) {
              j += 1;
            }
            i += 1;
          }
          $(this.el).children('ul').children().eq(j).remove();
        }
        return this.render_stats();
      };
      BinView.prototype.render_stats = function() {
        $(this.el).find('.bin-stats').first().html("" + (this.model.get('num_complete')) + " / " + (this.model.get('num_required'))).addClass(this.model.is_valid() ? 'label label-success' : 'label label-info');
        return $(this.el).removeClass('fulfilled').removeClass('not-fulfilled').addClass(this.model.is_valid() ? 'fulfilled' : 'not-fulfilled');
      };
      BinView.prototype.render = function() {
        var list;
        $(this.el).html(this.template({
          id: "bin_id_" + Math.random() * 100000,
          title: this.model.get('title') != null ? this.model.get('title') : null
        }));
        this.render_stats();
        list = $(this.el).find('ul');
        this.model.get('sub_completables').each(__bind(function(completable) {
          var new_view;
          new_view = null;
          if (completable.type === 'course') {
            if (!completable.get('valid')) {
              new_view = new CourseView({
                model: completable,
                parent_view: this
              });
            }
          } else if (completable.type === 'bin') {
            new_view = new BinView({
              model: completable,
              parent_view: this
            });
          } else {
            throw completable;
          }
          if (new_view !== null) {
            return list.append($('<li class="bin-item">').append(new_view.render().el));
          }
        }, this));
        return this;
      };
      return BinView;
    })();
    CourseView = (function() {
      __extends(CourseView, Backbone.View);
      function CourseView() {
        CourseView.__super__.constructor.apply(this, arguments);
      }
      CourseView.prototype.tagName = 'div';
      CourseView.prototype.initialize = function() {
        return this.model.on('change:valid', this.render, this);
      };
      CourseView.prototype.render = function() {
        $(this.el).addClass('course-in-bin').html(this.model.get('title'));
        $(this.el).draggable({
          drag: __bind(function(event, ui) {
            return window.drag_board.start_drag(this);
          }, this),
          revert: 'invalid'
        });
        return this;
      };
      return CourseView;
    })();
    MajorView = (function() {
      __extends(MajorView, Backbone.View);
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
    })();
    ObjectivesListView = (function() {
      __extends(ObjectivesListView, Backbone.View);
      function ObjectivesListView() {
        ObjectivesListView.__super__.constructor.apply(this, arguments);
      }
      ObjectivesListView.prototype.tagName = 'div';
      ObjectivesListView.prototype.id = 'objectives-view';
      ObjectivesListView.prototype.template = _.template($('#objectives-list-template').html());
      ObjectivesListView.prototype.initialize = function() {
        this.subviews = [];
        return this.model.each(__bind(function(objective) {
          var new_view;
          switch (objective.get('type')) {
            case Objective.TYPE_MAJOR:
              new_view = new MajorView({
                model: objective
              });
              return this.subviews.push(new_view);
            default:
              throw "not implemented";
          }
        }, this));
      };
      ObjectivesListView.prototype.render = function() {
        var the_list;
        $(this.el).html(this.template());
        the_list = $(this.el).find('ul');
        _.each(this.subviews, __bind(function(subview) {
          return the_list.append($("<li>").append(subview.render().el));
        }, this));
        return this;
      };
      return ObjectivesListView;
    })();
    $('body').ajaxError(function() {
      return console.log(arguments[3].toString());
    });
    schedule = new Schedule({
      grad_year: 2015
    });
    objectives_list = new ObjectivesList;
    return $.getJSON('/static/major_reqs/cmsc.json', __bind(function(cmsc_bin) {
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
      app_view.render();
      return $('.bin-title').each(__bind(function(k, v) {
        return $(v).parent().parent().parent().children('ul').removeClass('in').addClass('collapse');
      }, this));
    }, this));
  });
}).call(this);
