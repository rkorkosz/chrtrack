var interval = 0;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.log.is_running && !interval) {
        interval = updateTimer(request.log);
    }
    if (!request.log.is_running) {
        clearInterval(interval);
        interval = 0;
        chrome.browserAction.setBadgeText({text: "00:00"});
        chrome.browserAction.setTitle({title: "RTrack"});
    }
});

function updateTimer(log) {
    var time = moment().diff(moment(log.start)) + log.duration,
        duration = moment.duration(time, 'milliseconds'), interval = 1000;
    return setInterval(function () {
        duration = moment.duration(duration.asMilliseconds() + interval, 'milliseconds');
        chrome.browserAction.setBadgeText({text: formatDuration(duration)});
    }, interval);
}

function formatDuration(duration) {
    var format = duration.asMilliseconds() < 60 * 60 * 1000 ? 'mm:ss' : 'h:mm:ss';
    return duration.format(format, {trim: false});
}