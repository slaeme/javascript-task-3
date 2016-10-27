'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

function Time(weekdays) {
    var self = this;
    self.weekdays = weekdays;

    self.addMinutes = function (time, minutes) {
        var min = self.getMinutes(time);
        min += minutes;

        return self.getTime(min);
    };

    self.getMinutes = function (time) {
        var parseTime = time.match(/^(\d) (\d{2}):(\d{2})$/);

        return Number(parseTime[1]) * 24 * 60 +
            Number(parseTime[2]) * 60 + Number(parseTime[3]);
    };

    self.getTime = function (minutes) {
        var day = Math.floor(minutes / (24 * 60));
        minutes -= day * 24 * 60;
        var hour = Math.floor(minutes / 60);
        var hourStr = (hour < 10) ? '0' + hour.toString() : hour.toString();
        minutes -= hour * 60;
        var minutesStr = (minutes < 10) ? '0' + minutes.toString() : minutes.toString();

        return day.toString() + ' ' + hourStr + ':' + minutesStr;
    };

    self.getDuration = function (from, to) {
        return self.getMinutes(to) - self.getMinutes(from);
    };

    self.shiftTimeZone = function (time, different) {
        var hour = time.hour + different;
        var day = time.day;
        var minutes = time.minutes;
        if (hour < 0) {
            if (time.day) {
                hour = minutes = 0;
            } else {
                hour += 24;
                day--;
            }
        } else if (hour > 23) {
            if (time.day === self.weekdays.length) {
                hour = 23;
                minutes = 59;
            } else {
                hour -= 24;
                day++;
            }
        }

        return {
            day: day,
            hour: hour,
            minutes: minutes
        };
    };

    self.convertStrToTime = function (timeStr) {
        var parseTime = timeStr.match(/^(.{2}) (\d{2}):(\d{2})\+(\d)+$/);

        if (parseTime.length === 5) {
            return {
                day: self.weekdays.indexOf(parseTime[1]),
                hour: Number(parseTime[2]),
                minutes: Number(parseTime[3]),
                zone: Number(parseTime[4])
            };
        }

        return {
            hour: Number(parseTime[1]),
            minutes: Number(parseTime[2]),
            zone: Number(parseTime[3])
        };
    };

    self.convertTimeToKey = function (time) {
        var key = time.day.toString() + ' ';
        var hour = (time.hour < 10) ? '0' + time.hour.toString() : time.hour.toString();
        var minutes = (time.minutes < 10) ? '0' + time.minutes.toString() : time.minutes.toString();
        key += hour + ':' + minutes;

        return key;
    };
}

function RobberySchedule() {
    var self = this;
    self.weekdays = ['ПН', 'ВТ', 'СР'];
    self.timeTable = {};
    self.suitable = [];
    self.timeObj = new Time(self.weekdays);

    self.getTimeTable = function () {
        return self.timeTable;
    };

    self.filter = function (stepInMinutes) {
        var filterSuitable = [];
        if (!self.suitable.length) {
            return filterSuitable;
        }
        var time = self.suitable[0].time;
        filterSuitable.push(time);
        for (var i = 1; i < self.suitable.length; i++) {
            time = self.addNextMoment(filterSuitable, time, i, stepInMinutes);
        }

        return filterSuitable;
    };

    self.addNextMoment = function (filterSuitable, lastTime, i, stepInMinutes) {
        if (self.timeObj.getDuration(lastTime, self.suitable[i].time) < stepInMinutes) {
            return lastTime;
        }
        lastTime = self.suitable[i].time;
        filterSuitable.push(lastTime);
        var duration = self.suitable[i].duration - stepInMinutes;
        while (duration >= self.duration) {
            lastTime = self.timeObj.addMinutes(lastTime, stepInMinutes);
            duration -= stepInMinutes;
            filterSuitable.push(lastTime);
        }

        return lastTime;
    };

    self.getAllSuitableMoments = function (duration) {
        self.duration = duration;
        var sortedKeys = Object.keys(self.timeTable).sort();
        sortedKeys.forEach(function (key) {
            var node = self.timeTable[key];
            var suitable = true;
            for (var who in node) {
                if (who === 'duration') {
                    suitable = suitable && (node[who] >= duration);
                    continue;
                }
                suitable = suitable && node[who];
                if (!suitable) {
                    break;
                }
            }
            if (suitable) {
                self.suitable.push({
                    time: key,
                    duration: node.duration
                });
            }
        });

        return self.suitable;
    };

    self.fillTimeTable = function (schedule, workingHours) {
        self.fillPointTimeTable(schedule, workingHours);
        self.fillIntervalTimeTable(schedule);
    };

    self.addBusy = function (works, thief, houseTimeZone) {
        for (var i = 0; i < works.length; i++) {
            var from = self.timeObj.convertStrToTime(works[i].from);
            var to = self.timeObj.convertStrToTime(works[i].to);
            var differentTZ = houseTimeZone - from.zone;
            var fromHouseTZ = self.timeObj.shiftTimeZone(from, differentTZ);
            var toHouseTZ = self.timeObj.shiftTimeZone(to, differentTZ);
            var keyFrom = self.timeObj.convertTimeToKey(fromHouseTZ);
            var keyTo = self.timeObj.convertTimeToKey(toHouseTZ);
            self.addNode(keyFrom, thief, false);
            self.addNode(keyTo, thief, true);
        }
    };

    self.fillPointTimeTable = function (schedule, workingHours) {
        var houseTimeZone = self.timeObj.convertStrToTime('ПН ' + workingHours.from).zone;
        for (var thief in schedule) {
            if ({}.hasOwnProperty.call(schedule, thief)) {
                self.addBusy(schedule[thief], thief, houseTimeZone);
            }
        }
        self.weekdays.forEach(function (day) {
            var from = self.timeObj.convertStrToTime(day + ' ' + workingHours.from);
            var to = self.timeObj.convertStrToTime(day + ' ' + workingHours.to);
            var keyFrom = self.timeObj.convertTimeToKey(from);
            var keyTo = self.timeObj.convertTimeToKey(to);
            self.addNode(keyFrom, 'bank', true);
            self.addNode(keyTo, 'bank', false);
        });
    };

    self.fillIntervalTimeTable = function (schedule) {
        var sortedKeys = Object.keys(self.timeTable).sort();
        var currentStatus = {};
        for (var thief in schedule) {
            if ({}.hasOwnProperty.call(schedule, thief)) {
                currentStatus[thief] = true;
            }
        }
        currentStatus.bank = false;
        sortedKeys.forEach(function (key, i, array) {
            var node = self.timeTable[key];
            for (var who in currentStatus) {
                if (node[who] === undefined) {
                    node[who] = currentStatus[who];
                } else {
                    currentStatus[who] = node[who];
                }
            }
            if (i !== sortedKeys.length - 1) {
                node.duration = self.timeObj.getDuration(key, array[i + 1]);
            } else {
                var lastTime = (self.weekdays.length - 1).toString() + ' 23:59';
                node.duration = self.timeObj.getDuration(key, lastTime);
            }
        });
    };

    self.addNode = function (key, who, status) {
        var node = self.timeTable[key];
        if (node !== undefined) {
            node[who] = status;
        } else {
            self.timeTable[key] = {};
            self.timeTable[key][who] = status;
        }
    };
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var self = this;
    var robberySchedule = new RobberySchedule();
    robberySchedule.fillTimeTable(schedule, workingHours);
    self.weekdays = robberySchedule.weekdays;
    self.suitable = robberySchedule.getAllSuitableMoments(duration);
    self.suitableWithFilter = robberySchedule.filter(30);
    self.currentIndex = 0;
    console.info(self.suitable);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return self.suitable.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!self.suitableWithFilter.length) {
                return '';
            }
            var time = self.suitableWithFilter[self.currentIndex];
            var parseTime = time.match(/^(\d) (\d{2}):(\d{2})$/);
            var day = self.weekdays[Number(parseTime[1])];
            template = template.replace('%HH', parseTime[2]);
            template = template.replace('%MM', parseTime[3]);
            template = template.replace('%DD', day);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (self.currentIndex < self.suitableWithFilter.length - 1) {
                self.currentIndex++;

                return true;
            }

            return false;
        }
    };
};
