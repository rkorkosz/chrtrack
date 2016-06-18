(function () {
    "use strict";
    angular
        .module('RTrack')
        .controller("MainController", MainController);

    /**
     * @param Restangular
     * @param moment
     * @param $interval
     * @constructor
     */
    function MainController(Restangular, moment, $interval) {
        var vm = this, logs = Restangular.all("logs"), projects = Restangular.all("projects");
        vm.project = {};
        vm.projects = [];
        vm.task = {};
        vm.tasks = [];
        vm.timeLogs = [];
        vm.addTimeLog = addTimeLog;
        vm.searchProject = searchProject;
        vm.searchTask = searchTask;
        vm.stopLog = stopLog;
        vm.runLog = updateTime;
        vm.removeLog = removeLog;
        vm.retryLog = retryLog;

        logs.getList().then(function(logs) {
            angular.forEach(logs, function(log) {
                vm.timeLogs.push(log);
                log.timer = formatDuration(moment.duration(log.duration));
                if (log.is_running) {
                    updateTime(log);
                }
            });
        });

        function retryLog(i, log) {
            delete log.id;
            log.duration = 0;
            log.is_running = true;
            log.start = moment().format();
            logs.post(log).then(function(rlog) {
                vm.timeLogs[i] = rlog;
                updateTime(rlog);
            });
        }

        function removeLog(i, log) {
            var is_running = log.is_running;
            log.remove().then(function() {
                vm.timeLogs.splice(i, 1);
                if (is_running) {
                    chrome.browserAction.setBadgeText({text:"00:00"});
                    chrome.browserAction.setTitle({title: "RTrack"});
                }
            });
        }

        function stopLog(log) {
            log.is_running = false;
            $interval.cancel(log.ticker);
            log.put().then(function() {
                chrome.runtime.sendMessage({log: log});
            });
        }

        function updateTime(log) {
            log.is_running = true;
            var duration, interval = 1000,
                time = moment().diff(moment(log.start)) + log.duration;
            duration = moment.duration(time, 'milliseconds');
            log.timer = formatDuration(duration);
            chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
            chrome.browserAction.setBadgeText({text:log.timer});
            chrome.runtime.sendMessage({log: log});
            chrome.browserAction.setTitle({title: [log.project_name, log.task_name].join(" - ")});
            log.ticker = $interval(function() {
                duration = moment.duration(duration.asMilliseconds() + interval, 'milliseconds');
                log.duration = duration.asMilliseconds();
                log.timer = formatDuration(duration);
            }, interval);
        }

        function formatDuration(duration) {
            var format = duration.asMilliseconds() < 60*60*1000 ? 'mm:ss' : 'h:mm:ss';
            return duration.format(format, { trim: false });
        }

        function addTimeLog() {
            logs.post(makeLog()).then(function(log) {
                vm.timeLogs.push(log);
                updateTime(log);
            });
        }

        function makeLog() {
            var log = {project_name: vm.project.name};
            if (!!vm.task) {
                log.task_name = vm.task.name;
            }
            return log;
        }

        function searchProject(search) {
            if (search.length > 2) {
                projects.customGET('', {name: search}).then(function(projects) {
                    vm.projects = projects;
                });
            }
        }

        function searchTask(search) {
            if (search.length > 2) {
                Restangular.one("projects", vm.project.id).getList("tasks", {name: search}).then(function (tasks) {
                    vm.tasks = tasks;
                });
            }
        }
    }

    MainController.$inject = ['Restangular', "moment", "$interval"];
})();
